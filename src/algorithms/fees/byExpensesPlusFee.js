import { supabase } from "../../supabaseClient";
import { recalculateBalancesForward } from "./utils/ledgerUtils";

/**
 * Алгоритъм: byExpensesPlusFee (Разпределение по КВАДРАТУРА с винаги закръгляне НАГОРЕ)
 * - Всички междинни изчисления (перата) се закръглят ВИНАГИ НАГОРЕ до 1 цент.
 * - Крайната сума за месеца се закръгля ВИНАГИ НАГОРЕ до 10 цента.
 * - Разликата (положителна) се запазва в колона rounding_remainder за модул Каса.
 * - АВТОМАТИЗИРАН АВАНС: Изчислява се нетен баланс от минали месеци. Надплатеното става advance_payment.
 */
export async function byExpensesPlusFee(buildingId, month, year) {
  console.group(
    `🚀 СТАРТ НА АЛГОРИТЪМА (По площ, Закръгляне НАГОРЕ): Сграда ${buildingId} | ${month}/${year}`,
  );

  const { data: expenses, error: expError } = await supabase
    .from("expenses")
    .select("type, current_month, cost_category")
    .eq("building_id", buildingId)
    .eq("month", month)
    .eq("year", year);

  if (expError) throw new Error("Грешка при зареждане на разходите!");

  // --- ПРОМЯНА: Спираме генерирането при липсващи разходи, ОСВЕН ако не е Януари 2026 ---
  if ((!expenses || expenses.length === 0) && !(month === 1 && year === 2026)) {
    throw new Error("❌ Няма въведени разходи за избрания месец.");
  }
  // -------------------------------------------------------------------------------------
  const [
    { data: apartmentsRaw },
    { data: officesRaw },
    { data: garagesRaw },
    { data: retailsRaw },
    { data: feeSetting },
  ] = await Promise.all([
    supabase
      .from("apartments")
      .select("number, floor, user_id, area")
      .eq("building_id", buildingId),
    supabase
      .from("offices")
      .select("number, floor, user_id, area")
      .eq("building_id", buildingId),
    supabase
      .from("garages")
      .select("number, floor, user_id, area")
      .eq("building_id", buildingId),
    supabase
      .from("retails")
      .select("number, floor, user_id, area")
      .eq("building_id", buildingId),
    supabase
      .from("fee_settings")
      .select("setting_value")
      .eq("building_id", buildingId)
      .eq("setting_key", "management_fee_m2")
      .maybeSingle(),
  ]);

  const apartments = (apartmentsRaw || []).filter((a) => a.number != null);
  const offices = (officesRaw || []).filter((o) => o.number != null);
  const garages = (garagesRaw || []).filter((g) => g.number != null);
  const retails = (retailsRaw || []).filter((r) => r.number != null);

  const { data: pastFees } = await supabase
    .from("fees")
    .select("client_id, object_number, current_month_due, paid, type")
    .eq("building_id", buildingId)
    .or(`year.lt.${year},and(year.eq.${year},month.lt.${month})`);

  const balances = {};
  (pastFees || []).forEach((f) => {
    const key = `${f.client_id}_${f.type}_${f.object_number}`;
    if (!balances[key]) balances[key] = 0;
    balances[key] += Number(f.current_month_due || 0) - Number(f.paid || 0);
  });

  const aptObjs = apartments.map((o) => ({
    ...o,
    type: "апартамент",
    category: "apartments",
  }));
  const offObjs = offices.map((o) => ({
    ...o,
    type: "офис",
    category: "offices",
  }));
  const garObjs = garages.map((o) => ({
    ...o,
    type: "гараж",
    category: "garages",
  }));
  const retObjs = retails.map((o) => ({
    ...o,
    type: "ритейл",
    category: "retails",
  }));

  const allObjects = [...aptObjs, ...offObjs, ...garObjs, ...retObjs];

  const totalAreas = {
    apartments: aptObjs.reduce((sum, obj) => sum + Number(obj.area || 0), 0),
    offices: offObjs.reduce((sum, obj) => sum + Number(obj.area || 0), 0),
    garages: garObjs.reduce((sum, obj) => sum + Number(obj.area || 0), 0),
    retails: retObjs.reduce((sum, obj) => sum + Number(obj.area || 0), 0),
    nonRetail: 0,
    all: 0,
  };
  totalAreas.nonRetail =
    totalAreas.apartments + totalAreas.offices + totalAreas.garages;
  totalAreas.all = totalAreas.nonRetail + totalAreas.retails;

  if (allObjects.length === 0) {
    console.groupEnd();
    throw new Error("❌ Сградата няма дефинирани обекти.");
  }

  const managementRate = Number(feeSetting?.setting_value || 0);

  const dist = {
    apt_stair: 0,
    apt_elev: 0,
    apt_cleaner: 0,
    apt_repairs: 0,
    apt_other: 0,

    off_stair: 0,
    off_elev: 0,
    off_cleaner: 0,
    off_repairs: 0,
    off_other: 0,

    gar_elect: 0,
    gar_other: 0,

    electricity_ventilation: 0,
    cleaner: 0,
    electricity_light: 0,
    electricity_lift: 0,
    fee_lift: 0,
    repairs: 0,
    water_building: 0,
    cleaning_supplies: 0,
    fee_annual_review: 0,
    internet_video: 0,
    access_control: 0,
    pest_control: 0,
    lighting: 0,
    other: 0,
  };

  expenses.forEach((exp) => {
    const val = Number(exp.current_month || 0);
    const type = exp.type;
    const cat = exp.cost_category || "common";

    if (cat === "apartments") {
      if (type === "electricity_light") dist.apt_stair += val;
      else if (type === "electricity_lift" || type === "fee_lift")
        dist.apt_elev += val;
      else if (type === "cleaner") dist.apt_cleaner += val;
      else if (type === "repairs") dist.apt_repairs += val;
      else dist.apt_other += val;
    } else if (cat === "offices") {
      if (type === "electricity_light") dist.off_stair += val;
      else if (type === "electricity_lift" || type === "fee_lift")
        dist.off_elev += val;
      else if (type === "cleaner") dist.off_cleaner += val;
      else if (type === "repairs") dist.off_repairs += val;
      else dist.off_other += val;
    } else if (cat === "garages") {
      if (type === "electricity_light" || type === "electricity_garages")
        dist.gar_elect += val;
      else dist.gar_other += val;
    } else {
      if (dist[type] !== undefined) dist[type] += val;
      else dist.other += val;
    }
  });

  const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
  const ceilTo1Cent = (num) => Math.ceil(Math.round(num * 1000) / 10) / 100;
  const roundUpTo10Cents = (num) => {
    const safeNum = Math.round(num * 100);
    return Math.ceil(safeNum / 10) / 10;
  };

  const distributeByArea = (totalAmount, objectArea, totalCategoryArea) => {
    if (totalCategoryArea <= 0) return 0;
    return ceilTo1Cent((totalAmount * objectArea) / totalCategoryArea);
  };

  const feesToInsert = allObjects.map((obj) => {
    const area = Number(obj.area || 0);
    const mngFee = ceilTo1Cent(area * managementRate);

    const netBalance = round2(
      balances[`${obj.user_id}_${obj.type}_${obj.number}`] || 0,
    );

    const previousDebt = netBalance > 0 ? netBalance : 0;
    const advancePayment = netBalance < 0 ? Math.abs(netBalance) : 0;

    let row = {
      building_id: buildingId,
      client_id: obj.user_id,
      object_number: String(obj.number),
      type: obj.type,
      floor: obj.floor,
      month,
      year,
      paid: 0,
      management_fee: mngFee,
      previous_debt: previousDebt,
      advance_payment: advancePayment,
      rounding_remainder: 0,
      electricity_ventilation: 0,
      cleaner: 0,
      electricity_light: 0,
      electricity_lift: 0,
      fee_lift: 0,
      repairs: 0,
      water_common: 0,
      cleaning_materials: 0,
      elevator_inspection: 0,
      internet: 0,
      access_control: 0,
      disinsection: 0,
      lighting_supplies: 0,
      electricity_staircase_apartments: 0,
      electricity_elevator_apartments: 0,
      electricity_staircase_offices: 0,
      electricity_elevator_offices: 0,
      electricity_garages: 0,
      cash_feed: 0, // Инициализираме го на 0 за всеки случай
    };

    let distributedForObj = 0;

    if (obj.type !== "ритейл") {
      row.electricity_ventilation = distributeByArea(
        dist.electricity_ventilation,
        area,
        totalAreas.nonRetail,
      );
      row.cleaner = distributeByArea(dist.cleaner, area, totalAreas.nonRetail);
      row.electricity_light = distributeByArea(
        dist.electricity_light,
        area,
        totalAreas.nonRetail,
      );
      row.electricity_lift = distributeByArea(
        dist.electricity_lift,
        area,
        totalAreas.nonRetail,
      );
      row.fee_lift = distributeByArea(
        dist.fee_lift,
        area,
        totalAreas.nonRetail,
      );
      row.repairs = distributeByArea(
        dist.repairs + dist.other,
        area,
        totalAreas.nonRetail,
      );
      row.water_common = distributeByArea(
        dist.water_building,
        area,
        totalAreas.nonRetail,
      );
      row.cleaning_materials = distributeByArea(
        dist.cleaning_supplies,
        area,
        totalAreas.nonRetail,
      );
      row.elevator_inspection = distributeByArea(
        dist.fee_annual_review,
        area,
        totalAreas.nonRetail,
      );
      row.internet = distributeByArea(
        dist.internet_video,
        area,
        totalAreas.nonRetail,
      );
      row.access_control = distributeByArea(
        dist.access_control,
        area,
        totalAreas.nonRetail,
      );
      row.disinsection = distributeByArea(
        dist.pest_control,
        area,
        totalAreas.nonRetail,
      );
      row.lighting_supplies = distributeByArea(
        dist.lighting,
        area,
        totalAreas.nonRetail,
      );

      if (obj.category === "apartments") {
        row.electricity_staircase_apartments = distributeByArea(
          dist.apt_stair,
          area,
          totalAreas.apartments,
        );
        row.electricity_elevator_apartments = distributeByArea(
          dist.apt_elev,
          area,
          totalAreas.apartments,
        );
        row.cleaner += distributeByArea(
          dist.apt_cleaner,
          area,
          totalAreas.apartments,
        );
        row.repairs += distributeByArea(
          dist.apt_repairs + dist.apt_other,
          area,
          totalAreas.apartments,
        );
      } else if (obj.category === "offices") {
        row.electricity_staircase_offices = distributeByArea(
          dist.off_stair,
          area,
          totalAreas.offices,
        );
        row.electricity_elevator_offices = distributeByArea(
          dist.off_elev,
          area,
          totalAreas.offices,
        );
        row.cleaner += distributeByArea(
          dist.off_cleaner,
          area,
          totalAreas.offices,
        );
        row.repairs += distributeByArea(
          dist.off_repairs + dist.off_other,
          area,
          totalAreas.offices,
        );
      } else if (obj.category === "garages") {
        row.electricity_garages = distributeByArea(
          dist.gar_elect,
          area,
          totalAreas.garages,
        );
        row.repairs += distributeByArea(
          dist.gar_other,
          area,
          totalAreas.garages,
        );
      }

      distributedForObj = [
        row.electricity_ventilation,
        row.cleaner,
        row.electricity_light,
        row.electricity_lift,
        row.fee_lift,
        row.repairs,
        row.water_common,
        row.cleaning_materials,
        row.elevator_inspection,
        row.internet,
        row.access_control,
        row.disinsection,
        row.lighting_supplies,
        row.electricity_staircase_apartments,
        row.electricity_elevator_apartments,
        row.electricity_staircase_offices,
        row.electricity_elevator_offices,
        row.electricity_garages,
      ].reduce((acc, val) => acc + (Number(val) || 0), 0);
    }

    const exactCurrentMonthDue = round2(row.management_fee + distributedForObj);

    // --- ПРОМЯНА: Проверяваме месеца ПРЕДИ да приложим закръглянето ---
    if (month === 1 && year === 2026) {
      // За Януари 2026: ползваме точната сума без закръгляне
      row.current_month_due = exactCurrentMonthDue;
      row.rounding_remainder = 0;
      row.cash_feed = exactCurrentMonthDue; // Захранването на касата е с точната сума
    } else {
      // За всички останали месеци: стандартно закръгляне нагоре към 10 стотинки
      row.current_month_due = roundUpTo10Cents(exactCurrentMonthDue);
      row.rounding_remainder = round2(
        row.current_month_due - exactCurrentMonthDue,
      );
    }
    // -------------------------------------------------------------------

    const calculatedTotal =
      row.current_month_due + row.previous_debt - row.advance_payment;
    row.total_due = calculatedTotal > 0 ? round2(calculatedTotal) : 0;

    return row;
  });

  await supabase
    .from("fees")
    .delete()
    .eq("building_id", buildingId)
    .eq("month", month)
    .eq("year", year);

  const { error: insErr } = await supabase.from("fees").insert(feesToInsert);

  if (insErr) {
    console.error("Грешка при запис:", insErr);
    throw insErr;
  }

  const { error: updateExpErr } = await supabase
    .from("expenses")
    .update({ paid: "да" })
    .eq("building_id", buildingId)
    .eq("month", month)
    .eq("year", year);

  if (updateExpErr) {
    console.error(
      "Грешка при отбелязване на разходите като платени:",
      updateExpErr,
    );
  } else {
    console.log(
      `✅ Всички разходи за ${month}/${year} са отбелязани като "Платено".`,
    );
  }
  await recalculateBalancesForward(buildingId);

  console.groupEnd();
  return feesToInsert.length;
}
