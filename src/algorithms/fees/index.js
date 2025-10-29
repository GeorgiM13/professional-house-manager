import { byExpensesPlusFee } from "./byExpensesPlusFee"
import { fixedFee } from "./fixedFee"


export async function generateFees(buildingId, month, year, algorithmType = "byExpensesPlusFee") {
  switch (algorithmType) {
    case "fixedFee" :
        return fixedFee(buildingId, month, year);
    default:
        return byExpensesPlusFee(buildingId, month, year);
  }
}