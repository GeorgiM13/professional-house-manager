import { supabase } from "../../../supabaseClient";

/**
 * Преизчислява всички стари задължения и аванси за цялата сграда.
 * Взима таксите хронологично и "превърта" баланса от месец в месец.
 */
export async function recalculateBalancesForward(buildingId) {
  const { data: allFees, error } = await supabase
    .from("fees")
    .select(
      "id, client_id, object_number, current_month_due, paid, previous_debt, advance_payment, total_due, type",
    )
    .eq("building_id", buildingId)
    .order("year", { ascending: true })
    .order("month", { ascending: true });

  if (error) {
    console.error("Грешка при изтегляне на такси за преизчисляване:", error);
    return;
  }

  const balances = {};
  const updatePromises = [];

  const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

  for (const fee of allFees) {
    const safeClientId = fee.client_id || "noclient";
    const key = `${safeClientId}_${fee.type}_${fee.object_number}`;

    const currentNetBalance = balances[key] || 0;

    const expectedDebt = currentNetBalance > 0 ? round2(currentNetBalance) : 0;
    const expectedAdvance =
      currentNetBalance < 0 ? round2(Math.abs(currentNetBalance)) : 0;

    const calculatedTotal =
      Number(fee.current_month_due || 0) + expectedDebt - expectedAdvance;
    const expectedTotalDue = calculatedTotal > 0 ? round2(calculatedTotal) : 0;

    if (
      Number(fee.previous_debt || 0) !== expectedDebt ||
      Number(fee.advance_payment || 0) !== expectedAdvance ||
      Number(fee.total_due || 0) !== expectedTotalDue
    ) {
      const promise = supabase
        .from("fees")
        .update({
          previous_debt: expectedDebt,
          advance_payment: expectedAdvance,
          total_due: expectedTotalDue,
        })
        .eq("id", fee.id);

      updatePromises.push(promise);
    }

    balances[key] = round2(
      currentNetBalance +
        Number(fee.current_month_due || 0) -
        Number(fee.paid || 0),
    );
  }

  if (updatePromises.length > 0) {
    try {
      await Promise.all(updatePromises);
      console.log(
        `✅ Успешно преизчислени и синхронизирани ${updatePromises.length} такси напред във времето.`,
      );
    } catch (updateError) {
      console.error(
        "Грешка при запазване на преизчислените такси:",
        updateError,
      );
    }
  } else {
    console.log("⚡ Всички баланси са точни, няма нужда от преизчисляване.");
  }
}
