import { supabase } from "../../supabaseClient";

/**
 * Алгоритъм: byExpensesPlusFee
 * - Всички междинни изчисления се правят с точност до 1 цент.
 * - Крайната сума за месеца се закръгля ВИНАГИ НАГОРЕ до 10 цента.
 * - Разликата (положителна) се запазва в колона rounding_remainder за модул Каса.
 */
export async function byExpensesPlusFee(buildingId, month, year) {
  console.group(
    `🚀 СТАРТ НА АЛГОРИТЪМА: Сграда ${buildingId} | ${month}/${year}`,
  );

  const { data: expenses, error: expError } = await supabase
    .from("expenses")
    .select("type, current_month, cost_category")
    .eq("building_id", buildingId)
    .eq("month", month)
    .eq("year", year);

  if (expError) throw new Error("Грешка при зареждане на разходите!");
  if (!expenses || expenses.length === 0)
    throw new Error("❌ Няма въведени разходи за избрания месец.");

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
    .select("client_id, object_number, current_month_due, paid")
    .eq("building_id", buildingId)
    .or(`year.lt.${year},and(year.eq.${year},month.lt.${month})`);

  const debts = {};
  (pastFees || []).forEach((f) => {
    const key = `${f.client_id}_${f.object_number}`;
    if (!debts[key]) debts[key] = 0;
    debts[key] += Number(f.current_month_due || 0) - Number(f.paid || 0);
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
  const counts = {
    apartments: aptObjs.length,
    offices: offObjs.length,
    garages: garObjs.length,
    nonRetail: aptObjs.length + offObjs.length + garObjs.length,
    all: allObjects.length,
  };

  if (counts.all === 0) {
    console.groupEnd();
    throw new Error("❌ Сградата няма дефинирани обекти.");
  }

  const managementRate = Number(feeSetting?.setting_value || 0);

  const dist = {
    apt_stair: 0,
    apt_elev: 0,
    off_stair: 0,
    off_elev: 0,
    gar_elect: 0,
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
    const cat = exp.cost_category;

    if (cat === "apartments") {
      if (type === "electricity_light") dist.apt_stair += val;
      else if (type === "electricity_lift" || type === "fee_lift")
        dist.apt_elev += val;
      else dist.other += val;
    } else if (cat === "offices") {
      if (type === "electricity_light") dist.off_stair += val;
      else if (type === "electricity_lift" || type === "fee_lift")
        dist.off_elev += val;
      else dist.other += val;
    } else if (cat === "garages") {
      dist.gar_elect += val;
    } else {
      if (dist[type] !== undefined) dist[type] += val;
      else dist.other += val;
    }
  });

  const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

  const roundUpTo10Cents = (num) => {
    const safeNum = Math.round(num * 100);
    return Math.ceil(safeNum / 10) / 10;
  };

  const distributeEvenly = (totalAmount, count) =>
    count <= 0 ? 0 : round2(totalAmount / count);

  const feesToInsert = allObjects.map((obj) => {
    const area = Number(obj.area || 0);
    const mngFee = round2(area * managementRate);
    const previousDebt = round2(debts[`${obj.user_id}_${obj.number}`] || 0);

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
    };

    let distributedForObj = 0;

    if (obj.type !== "ритейл") {
      row.electricity_ventilation = distributeEvenly(
        dist.electricity_ventilation,
        counts.nonRetail,
      );
      row.cleaner = distributeEvenly(dist.cleaner, counts.nonRetail);
      row.electricity_light = distributeEvenly(
        dist.electricity_light,
        counts.nonRetail,
      );
      row.electricity_lift = distributeEvenly(
        dist.electricity_lift,
        counts.nonRetail,
      );
      row.fee_lift = distributeEvenly(dist.fee_lift, counts.nonRetail);
      row.repairs = distributeEvenly(
        dist.repairs + dist.other,
        counts.nonRetail,
      );
      row.water_common = distributeEvenly(
        dist.water_building,
        counts.nonRetail,
      );
      row.cleaning_materials = distributeEvenly(
        dist.cleaning_supplies,
        counts.nonRetail,
      );
      row.elevator_inspection = distributeEvenly(
        dist.fee_annual_review,
        counts.nonRetail,
      );
      row.internet = distributeEvenly(dist.internet_video, counts.nonRetail);
      row.access_control = distributeEvenly(
        dist.access_control,
        counts.nonRetail,
      );
      row.disinsection = distributeEvenly(dist.pest_control, counts.nonRetail);
      row.lighting_supplies = distributeEvenly(dist.lighting, counts.nonRetail);

      if (obj.category === "apartments") {
        row.electricity_staircase_apartments = distributeEvenly(
          dist.apt_stair,
          counts.apartments,
        );
        row.electricity_elevator_apartments = distributeEvenly(
          dist.apt_elev,
          counts.apartments,
        );
      } else if (obj.category === "offices") {
        row.electricity_staircase_offices = distributeEvenly(
          dist.off_stair,
          counts.offices,
        );
        row.electricity_elevator_offices = distributeEvenly(
          dist.off_elev,
          counts.offices,
        );
      } else if (obj.category === "garages") {
        row.electricity_garages = distributeEvenly(
          dist.gar_elect,
          counts.garages,
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

    row.current_month_due = roundUpTo10Cents(exactCurrentMonthDue);

    row.rounding_remainder = round2(
      row.current_month_due - exactCurrentMonthDue,
    );

    row.total_due = round2(row.current_month_due + row.previous_debt);

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

  console.groupEnd();
  return feesToInsert.length;
}
