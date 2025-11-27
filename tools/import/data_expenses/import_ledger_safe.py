import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import re


load_dotenv() 

# --- ⚙️ НАСТРОЙКИ ---
PREVIEW_MODE = False  # <--- True: Тест, False: Запис
FILE_NAME = "ledger.xlsx" 
BUILDING_ID = 11     # ID за Цар Асен 31

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ГРЕШКА: Липсват ключове в .env!")
    exit()

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


print(f"📂 Четене на файл: {FILE_NAME}...")
try:
    df = pd.read_excel(FILE_NAME)
except Exception as e:
    print(f"❌ Грешка при четене: {e}")
    exit()

df.columns = df.columns.str.strip() 
opis_col = next((col for col in df.columns if col.lower() == 'опис'), None)

if not opis_col:
    print("❌ Грешка: Не намирам колона 'Опис'!")
    exit()

df_melted = df.melt(id_vars=[opis_col], var_name='date_raw', value_name='amount_raw')
data_to_upload = []

print("⚙️ Обработка по точния списък...")

for index, row in df_melted.iterrows():
    # --- A. СУМА ---
    amount_val = row['amount_raw']
    if pd.isna(amount_val) or amount_val == '' or amount_val == 0 or amount_val == '-': continue

    if isinstance(amount_val, str):
        amount_val = amount_val.replace('лв', '').replace(' ', '').replace(',', '.')
    
    try:
        amount_final = float(amount_val)
        if amount_final == 0: continue
    except: continue 

    # --- B. ДАТА ---
    date_str = str(row['date_raw']).replace(' г.', '').strip() 
    try:
        match = re.search(r'(\d{1,2})[./-](\d{4})', date_str)
        if match:
            month = int(match.group(1))
            year = int(match.group(2))
        else: continue
    except: continue

    # --- C. КАТЕГОРИИ (EXACT MAPPING) ---
    d = str(row[opis_col]).lower().strip() # d = description
    expense_type = 'other' # Default

    # --- 1. ТОЧНИ СЪВПАДЕНИЯ ---
    if d == 'почистване':
        expense_type = 'cleaner'
    
    elif 'консумативи за почистване' in d:
        expense_type = 'cleaning_supplies'

    elif 'домоуправител' in d:
        expense_type = 'manager'

    elif 'асансьор - сервиз' in d:
        expense_type = 'fee_lift'
    
    elif 'асансьор - ел' in d: 
        expense_type = 'electricity_lift'

    elif 'стълбище - ел' in d: 
        expense_type = 'electricity_light'

    elif 'годишен преглед' in d:
        expense_type = 'fee_annual_review'

    elif 'вода обща' in d:
        expense_type = 'water_building'

    elif 'пури' in d or 'стартер' in d or 'круш' in d:
        expense_type = 'lighting'

    elif 'машинно почистване' in d:
        expense_type = 'other'

    elif 'интернет' in d or 'видеон' in d:
        expense_type = 'internet_video'

    elif 'чип' in d:
        expense_type = 'access_control'

    elif any(phrase in d for phrase in [
        'дезинсекция', 'пръскане', 'хлебарки', 'гризачи', 
        'отрова', 'капани', 'дератизация'
    ]):
        expense_type = 'pest_control'

    # --- 2. ГРУПИ ЗА РЕМОНТ (REPAIR) ---
    elif any(phrase in d for phrase in [
        'брава', 'разговорно', 'ремонт', 'боядисване', 
        'насрещник', 'плъзгачи', 'автомат', 'смяна',
        'газова', 'входна врата', 'вик', 
        'дръжка', 'дръжки', 'масло', 'ел.брава',
        'водосток', 'датчик', 'монтаж', 'вишка', 'стълбищен ключ',
        'асфалтова настилка', 'изолация', 'направа ламарина покрив',
        'направа на мазилка', 'осветителни тела асансьор', 'модул за главен водомер',
        'комарници', 'отпушване на канал'
    ]):
        expense_type = 'repair'

    # --- 3. ГРУПИ ЗА ДРУГИ (OTHER) ---
    elif any(phrase in d for phrase in [
        'батерия', 'материали', 'други', 'ключар', 'сдо', 'табло',
        'концентратори', 'материали за водосток', 'балатум'
    ]):
        expense_type = 'other'

    # --- D. БЕЛЕЖКИ (NOTES) ---
    final_note = None
    if expense_type in ['repair', 'other']:
        final_note = str(row[opis_col]) 

    # --- E. ЗАПИС ---
    record = {
        "type": expense_type,
        "month": month,
        "year": year,
        "current_month": amount_final,
        "paid": "да",
        "building_id": BUILDING_ID,
        "notes": final_note
    }
    data_to_upload.append(record)

# --- РЕЗУЛТАТИ (ВЪРНАТА ПЪЛНА ТАБЛИЦА) ---

if PREVIEW_MODE:
    print(f"\n🛑 ТЕСТОВ РЕЖИМ (PREVIEW MODE)")
    print(f"📊 Общо записи: {len(data_to_upload)}\n")
    
    header = f"{'TYPE':<25} | {'MO':<2} | {'YEAR':<4} | {'AMOUNT':<8} | {'PAID':<4} | {'BLD':<3} | {'NOTES'}"
    print("-" * len(header))
    print(header)
    print("-" * len(header))

    for item in data_to_upload[:1000]:
        note_print = item['notes'] if item['notes'] else ""
        print(f"{item['type']:<25} | {item['month']:<2} | {item['year']:<4} | {item['current_month']:<8.2f} | {item['paid']:<4} | {item['building_id']:<3} | {note_print}")
    
    print("-" * len(header))
    print("\n👉 Огледай всичко. Ако е наред -> PREVIEW_MODE = False")

else:
    print(f"\n🚀 ЗАПИС В БАЗАТА... ({len(data_to_upload)} записа)")
    batch_size = 50
    for i in range(0, len(data_to_upload), batch_size):
        batch = data_to_upload[i:i+batch_size]
        try:
            supabase.table('expenses').insert(batch).execute()
            print(f"   ✅ Качени {i+1} - {min(i+len(batch), len(data_to_upload))}")
        except Exception as e:
            print(f"   ❌ Грешка: {e}")
    
    print("🎉 ГОТОВО!")