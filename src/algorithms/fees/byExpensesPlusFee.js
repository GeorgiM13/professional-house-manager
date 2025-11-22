import { supabase } from "../../supabaseClient";

//  * Алгоритъм: (Разходи / Обекти) + (Площ * 0.0417)

export async function byExpensesPlusFee(buildingId, month, year) {
  const { data: expenses, error: expError } = await supabase
    .from("expenses")
    .select("current_month")
    .eq("building_id", buildingId)
    .eq("month", month)
    .eq("year", year);

  if (expError) throw new Error("Грешка при зареждане на разходите!");
  if (!expenses || expenses.length === 0)
    throw new Error("❌ Няма въведени разходи за този месец.");

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.current_month || 0),
    0
  );

  const [{ data: apartments }, { data: offices }, { data: garages }, { data: retails }] =
    await Promise.all([
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
    ]);

  const allObjects = [
    ...(apartments || []).map((o) => ({ ...o, type: "апартамент" })),
    ...(offices || []).map((o) => ({ ...o, type: "офис" })),
    ...(garages || []).map((o) => ({ ...o, type: "гараж" })),
    ...(retails || []).map((o) => ({ ...o, type: "ритейл" })),
  ];

  const totalObjects = allObjects.length;
  if (totalObjects === 0)
    throw new Error("❌ Няма обекти в сградата за разпределение.");

  const { data: feeSetting, error: feeError } = await supabase
    .from("fee_settings")
    .select("setting_value")
    .eq("building_id", buildingId)
    .eq("setting_key", "management_fee_m2")
    .maybeSingle();

  if (feeError)
    throw new Error("⚠️ Грешка при зареждане на ставката за домоуправител.");
  if (!feeSetting?.setting_value)
    throw new Error(
      "❌ Няма дефинирана ставка за домоуправител (management_fee_m2) в fee_settings!"
    );
  const managementFeePerM2 = Number(feeSetting.setting_value);
  const baseFee = totalExpenses / totalObjects;

  const feesToInsert = allObjects.map((obj) => {
    const area = Number(obj.area || 0);
    const feeForObject = baseFee + area * managementFeePerM2;

    return {
      building_id: buildingId,
      client_id: obj.user_id,
      object_number: obj.number,
      type: obj.type,
      floor: obj.floor || null,
      month,
      year,
      current_month_due: feeForObject.toFixed(2),
      total_due: feeForObject.toFixed(2),
      paid: 0,
    };
  });

  await supabase
    .from("fees")
    .delete()
    .eq("building_id", buildingId)
    .eq("month", month)
    .eq("year", year);

  const { error: insertError } = await supabase
    .from("fees")
    .insert(feesToInsert);

  if (insertError)
    throw new Error(
      "Грешка при запис в таблицата fees: " + insertError.message
    );

  console.log(
    `✅ Генерирани ${feesToInsert.length} такси за сграда ${buildingId} (${month}/${year})`
  );

  return feesToInsert.length;
}
