import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import "./styles/ExpensesDetails.css"

function ExpensesDetails() {

    const { id } = useParams();
    const navigate = useNavigate();
    const [expense, setExpense] = useState(null);

    useEffect(() => {
        async function fetchExpense() {
            const { data, error } = await supabase
                .from("expenses")
                .select(`
                    id,
                    type,
                    month,
                    year,
                    current_month,
                    paid,
                    notes,
                    created_at,
                    building_id,
                    building:building_id(name,address)
                `)
                .eq("id", id)
                .single();

            if (error) {
                console.error("Supabase error:", error);
            } else {
                setExpense(data);
            }
        }
        fetchExpense();
    }, [id]);

    const expenseTypes = {
        electricity_lift: "Ток асансьор",
        fee_lift: "Сервиз асансьор",
        electricity_light: "Ток осветление",
        cleaner: "Хигиенист",
        other: "Други",
    };

    if (!expense) return <p>Зареждане...</p>;

    return (
        <div className="expenses-details-page">
            <button onClick={() => navigate(-1)}>← Назад към списъка</button>
            <h1>Детайли за разхода</h1>
            <p><strong>Адрес:</strong> {expense.building?.name}, {expense.building?.address}</p>
            <p><strong>Тип разход:</strong> {expenseTypes[expense.type] || expense.type}</p>
            <p><strong>Месец:</strong> {expense.month}</p>
            <p><strong>Година:</strong> {expense.year}</p>
            <p><strong>Текущ месец:</strong> {expense.current_month ? "Да" : "Не"}</p>
            <p><strong>Платено:</strong> {expense.paid ? "Да" : "Не"}</p>
            <p><strong>Бележки:</strong> {expense.notes || "-"}</p>
        </div>
    );
}

export default ExpensesDetails;
