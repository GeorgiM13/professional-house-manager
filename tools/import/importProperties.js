/**
 * importProperties.js (v6 - Fixes Applied)
 * -------------------------
 * - Запазена оригинална логика на v5
 * - FIX: Филтриране на празни редове (excel trailing commas)
 * - FIX: Групиране на собственици (един имейл за всички имоти на един човек)
 * node tools/import/importProperties.js --file tools/import/data/import_data.xlsx --preview
 */

import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs";

dotenv.config();

const argv = yargs(hideBin(process.argv))
  .option("file", { type: "string", demandOption: true })
  .option("preview", { type: "boolean" })
  .option("import", { type: "boolean" })
  .help().argv;

// preview e истина само ако ИЗРИЧНО имаме --preview, без --import
const isPreview = argv.preview && !argv.import;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const buildingCache = new Map();
const userCache = new Map();

// ---------- helpers ----------

function normalize(str) {
  return (str || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function generateStrongPassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass + "Aa1";
}

function transliterateToLatin(str) {
  const map = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
    р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
    ш: "sh", щ: "sht", ъ: "a", ю: "yu", я: "ya",
  };
  return (str || "")
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] || ch)
    .join("")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Генерира четим и уникален username.
 */
async function generateUsername(first, last, company) {
  let base = "";

  if (first && last) {
    base = `${transliterateToLatin(first)}${transliterateToLatin(last)}`;
  } else if (company) {
    base = transliterateToLatin(company);
  } else {
    base = "user";
  }

  base = base.replace(/[^a-z0-9]/g, "");

  let username = base || "user";
  let counter = 1;

  if (!isPreview) {
    let exists;
    do {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      exists = !!data;
      if (exists) username = `${base}${++counter}`;
    } while (exists);
  }

  return username;
}

function generateEmail(building, type, number) {
  const cyrToLat = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
    р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
    ш: "sh", щ: "sht", ъ: "a", ю: "yu", я: "ya", ь: "", ы: "i", э: "e",
  };

  const slug = normalize(building)
    .split("")
    .map((ch) => cyrToLat[ch] || ch)
    .join("")
    .replace(/[^a-z0-9]/g, "");

  return `${slug}.${type}.${number}@example.com`;
}

function formatOwner(row) {
  const name = `${row.first_name || ""} ${row.second_name || ""} ${
    row.last_name || ""
  }`.trim();
  const company =
    row.company_name && row.company_name.trim() !== ""
      ? ` (${row.company_name})`
      : "";
  return (name + company).trim();
}

async function getBuildingIdByName(name) {
  if (!name) return null;
  if (buildingCache.has(name)) return buildingCache.get(name);

  if (isPreview) {
    buildingCache.set(name, 0);
    return 0;
  }

  const { data, error } = await supabase
    .from("buildings")
    .select("id")
    .eq("name", name)
    .single();

  if (error || !data) {
    console.warn(`⚠️  Сградата "${name}" не е намерена.`);
    return null;
  }

  buildingCache.set(name, data.id);
  return data.id;
}

async function getAuthUserByEmail(email) {
  const { data } = await supabase.auth.admin.listUsers();
  return data?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Връща: { user, passwordPlain, status }
 */
async function findOrCreateUser(row, type, number, building) {
  const { first_name, second_name, last_name, company_name, email, phone } = row;
  
  const cleanedPhone = String(phone || "")
    .replace(/[^0-9]/g, "") 
    .replace(/^0+/, ""); 

  // 1. Първо определяме ключа за кеша (Кой е човекът?)
  let cacheKey = "";
  if (email && email.trim() !== "") {
    cacheKey = normalize(email);
  } else if (cleanedPhone) {
    cacheKey = `tel:${cleanedPhone}`;
  } else if (first_name || last_name || company_name) {
    const cleanCompany = (company_name || "")
      .replace(/["'()«»„“]/g, "")
      .replace(/\s+/g, " ");
    const combined = `${first_name || ""} ${second_name || ""} ${
      last_name || ""
    } ${cleanCompany}`.trim();
    
    // Ако случайно няма нито име, нито фирма, ползваме имота като ID
    if (!combined) {
        cacheKey = `object:${normalize(building)}-${normalize(type)}-${number}`;
    } else {
        cacheKey = `person:${normalize(combined)}`;
    }
  } else {
    cacheKey = `object:${normalize(building)}-${normalize(type)}-${number}`;
  }

  // 2. ПРОВЕРКА В КЕША: Преди да генерираме нов имейл!
  if (userCache.has(cacheKey)) {
    const cached = userCache.get(cacheKey);
    // Връщаме намерения потребител. Така той запазва оригиналния си имейл (от първия имот)
    // и не генерираме нов адрес (напр. arena.offices.28)
    return {
        ...cached,
        reused: true,
        status: "🔁 Повторно използван акаунт",
        source: "local-cache"
    };
  }

  // 3. Едва ако НЕ е намерен в кеша, генерираме имейл
  // Ако в ексела няма имейл, генерираме го на база текущия имот.
  // За следващите имоти на същия човек, кодът ще спре на т.2 и ще ползва този първи имейл.
  const finalEmail = email?.trim()
    ? email
    : generateEmail(building, type, number);

  let user = null;
  let passwordPlain = null;
  let status = "";
  let source = "";
  let username = "";

  // 🧪 Preview режим
  if (isPreview) {
    passwordPlain = generateStrongPassword();
    username = row.username || await generateUsername(first_name, last_name, company_name);
    
    // Fallback за username
    if (!username || username === "(няма)") {
        username = finalEmail.split('@')[0];
    }

    status = "🧪 Нов акаунт (симулиран)";
    
    const fakeUser = { id: cacheKey.length + Date.now(), email: finalEmail, username };

    // Проверка за всеки случай (ако кеш логиката по-горе е пропуснала нещо)
    if (!email && userCache.has(cacheKey)) {
      const existing = userCache.get(cacheKey);
      fakeUser.email = existing.user.email;
      fakeUser.username = existing.user.username;
      passwordPlain = existing.passwordPlain;
      status = "🔁 Повторно използван акаунт";
    }

    const result = {
      user: fakeUser,
      passwordPlain,
      status,
      source: email ? "email" : "auto-generated",
      reused: !status.includes("Нов"),
    };

    userCache.set(cacheKey, result);
    return result;
  }

  // 💾 Реален режим — Supabase
  if (finalEmail) { // Ползваме вече дефинирания finalEmail
    const { data } = await supabase
      .from("users")
      .select("id, email, auth_user_id, username") // взимаме и username
      .eq("email", finalEmail)
      .maybeSingle();
    if (data) {
      user = data;
      status = "🔁 Повторно използван акаунт";
      source = "email";
    }
  }

  if (!user && cleanedPhone) {
    const { data } = await supabase
      .from("users")
      .select("id, phone, auth_user_id, username") // взимаме и username
      .eq("phone", cleanedPhone)
      .maybeSingle();
    if (data) {
      user = data;
      status = "🔁 Повторно използван акаунт";
      source = "phone";
    }
  }

  if (!user) {
    // Проверка по имена (DB fallback)
    const { data } = await supabase
      .from("users")
      .select(
        "id, first_name, second_name, last_name, company_name, auth_user_id, username, email"
      );

    const match = data?.find(
      (u) =>
        normalize(u.first_name) === normalize(first_name) &&
        normalize(u.second_name) === normalize(second_name) &&
        normalize(u.last_name) === normalize(last_name) &&
        normalize(u.company_name) === normalize(company_name)
    );
    if (match) {
      user = match;
      status = "🔁 Повторно използван акаунт";
      source = "name";
    }
  }

  if (!user) {
    passwordPlain = generateStrongPassword();
    username = await generateUsername(first_name, last_name, company_name);

    const { data: createdAuth } = await supabase.auth.admin.createUser({
      email: finalEmail,
      password: passwordPlain,
      email_confirm: true,
    });

    const authUser = createdAuth?.user;
    if (authUser) {
      const passwordHash = await bcrypt.hash(passwordPlain, 10);
      const { data } = await supabase
        .from("users")
        .insert([
          {
            first_name: first_name || "Неизвестен",
            second_name: second_name || "",
            last_name: last_name || "",
            company_name: company_name || null,
            email: finalEmail,
            phone: phone || null,
            role: "user",
            username: username,
            password_hash: passwordHash,
            auth_user_id: authUser.id,
          },
        ])
        .select("*")
        .single();

      user = data;
      status = "🆕 Създаден акаунт";
      source = "new";
    }
  }

  const result = { user, passwordPlain, status, source, reused: !!user && !passwordPlain }; // ако има user, но няма парола (значи е стар) -> reused
  userCache.set(cacheKey, result);
  return result;
}

/**
 * insertOrUpdateProperty()
 */
async function insertOrUpdateProperty(
  type,
  building_id,
  user_id,
  number,
  floor,
  area
) {
  const table = type; // 'apartments' | 'garages' | 'offices'

  // 1️⃣ Проверяваме дали имотът вече съществува
  const { data: existing, error: fetchError } = await supabase
    .from(table)
    .select("id, user_id")
    .eq("building_id", building_id)
    .eq("number", number)
    .maybeSingle();

  if (fetchError) {
    console.warn(
      `⚠️ Грешка при проверка за ${type} #${number}:`,
      fetchError.message
    );
    return { status: "error", message: fetchError.message };
  }

  // 2️⃣ Ако съществува и няма потребител → обновяваме
  if (existing && !existing.user_id) {
    const { error: updateError } = await supabase
      .from(table)
      .update({
        user_id,
        floor: floor || null,
        area: area || null,
      })
      .eq("id", existing.id);

    if (updateError) {
      console.warn(
        `⚠️ Неуспешно обновяване на ${type} #${number}:`,
        updateError.message
      );
      return { status: "update-error" };
    }

    return { status: "updated-existing" };
  }

  // 3️⃣ Ако съществува, но вече има потребител → пропускаме
  if (existing && existing.user_id) {
    return { status: "already-assigned" };
  }

  // 4️⃣ Ако не съществува → създаваме нов ред
  const { error: insertError } = await supabase.from(table).insert([
    {
      building_id,
      user_id,
      number,
      floor: floor || null,
      area: area || null,
    },
  ]);

  if (insertError) {
    console.warn(
      `⚠️ Неуспешно добавяне на ${type} #${number}:`,
      insertError.message
    );
    return { status: "insert-error" };
  }

  return { status: "inserted" };
}

/**
 * detectType(row)
 */
function detectType(row) {
  const lowerToOriginal = {};
  for (const originalKey of Object.keys(row)) {
    lowerToOriginal[originalKey.toLowerCase().trim()] = originalKey;
  }

  const aptLower = Object.keys(lowerToOriginal).find((k) =>
    k.includes("apartment")
  );
  const garLower = Object.keys(lowerToOriginal).find((k) =>
    k.includes("garage")
  );
  const offLower = Object.keys(lowerToOriginal).find((k) =>
    k.includes("office")
  );

  const aptVal = aptLower ? row[lowerToOriginal[aptLower]] : undefined;
  const garVal = garLower ? row[lowerToOriginal[garLower]] : undefined;
  const offVal = offLower ? row[lowerToOriginal[offLower]] : undefined;

  const isValid = (v) =>
    v !== undefined &&
    v !== null &&
    String(v).trim() !== "" &&
    String(v).trim().toLowerCase() !== "null" &&
    String(v).trim().toLowerCase() !== "undefined";

  const hasApt = isValid(aptVal);
  const hasGar = isValid(garVal);
  const hasOff = isValid(offVal);

  const count = [hasApt, hasGar, hasOff].filter(Boolean).length;

  if (count === 0) {
    return {
      type: null,
      number: null,
      error: "❌ Липсва номер на апартамент, гараж или офис",
    };
  }
  if (count > 1) {
    return {
      type: null,
      number: null,
      error: "❌ Повече от един тип номер е попълнен (ап/гр/оф едновременно)",
    };
  }

  if (hasApt) {
    return {
      type: "apartments",
      number: isNaN(aptVal) ? String(aptVal).trim() : Number(aptVal),
    };
  }
  if (hasGar) {
    return {
      type: "garages",
      number: isNaN(garVal) ? String(garVal).trim() : Number(garVal),
    };
  }
  return {
    type: "offices",
    number: isNaN(offVal) ? String(offVal).trim() : Number(offVal),
  };
}

function parseArea(val) {
  if (!val && val !== 0) return null;
  if (typeof val === "number") return val;
  return parseFloat(String(val).replace(",", "."));
}

// ---------- main ----------

async function main() {
  const workbook = XLSX.readFile(argv.file);
  let rows = XLSX.utils.sheet_to_json(
    workbook.Sheets[workbook.SheetNames[0]]
  );

  // --- FIX START: Изчистване на празните редове ---
  const initialLength = rows.length;
  rows = rows.filter(r => {
      // Редът е валиден, ако има поне Име на собственик ИЛИ Име на сграда
      const hasOwner = (r.first_name || r.company_name || r.Owner || "").toString().trim().length > 0;
      const hasBuilding = (r.building_name || "").toString().trim().length > 0;
      return hasOwner || hasBuilding;
  });
  console.log(`🧹 Изчистени празни редове: ${initialLength - rows.length}`);
  // --- FIX END ---

  const csvRows = [];
  const summary = { apartments: 0, garages: 0, offices: 0, skipped: 0 };

  console.log(`\n📖 Заредени редове за обработка: ${rows.length}`);
  console.log(
    isPreview ? "🔍 PREVIEW (без запис)\n" : "🚀 IMPORT ⚠️ реални промени\n"
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const typeInfo = detectType(row);

    if (!typeInfo.type) {
      summary.skipped++;
      console.warn(
        `⚠️ Пропускам ред ${i + 1}: ${typeInfo.error || "неизвестна причина"}`
      );
      continue;
    }

    const building_id = await getBuildingIdByName(row.building_name);
    if (building_id === null || building_id === undefined) {
      summary.skipped++;
      console.warn(
        `⚠️ Пропускам ред ${i + 1}: Сградата "${
          row.building_name
        }" не е намерена`
      );
      continue;
    }

    // user (preview -> само симулира, import -> real work)
    const { user, passwordPlain, status, source, reused } =
      (await findOrCreateUser(
        row,
        typeInfo.type,
        typeInfo.number,
        row.building_name
      )) || {};

    const owner = formatOwner(row);
    // Използваме имейла от user обекта, за да сме сигурни, че е правилният (за груповите собственици)
    const email =
      user?.email ||
      row.email ||
      generateEmail(row.building_name, typeInfo.type, typeInfo.number);

    const password = passwordPlain || (reused ? "(съществуващ акаунт)" : "");
    const area = parseArea(row.area);
    const floor =
      row.floor !== undefined && row.floor !== null && row.floor !== ""
        ? Number(row.floor)
        : null;

    // Взимаме коректен username (ако няма в ексела, взимаме от user обекта)
    const username = user?.username || "(няма)";

    // лог ред
    const link = `${typeInfo.type} #${typeInfo.number} (${row.building_name})`;
    console.log(
      `${
        typeInfo.type === "apartments"
          ? "🏠 Апартамент"
          : typeInfo.type === "garages"
          ? "🚗 Гараж"
          : "🏢 Офис"
      } | ${owner.padEnd(35)} | 📧 ${email.padEnd(35)} | 🔑 ${
        passwordPlain ? passwordPlain.padEnd(14) : "(съществуващ акаунт)"
      } | ${status.padEnd(28)} | 🔗 ${link}`
    );

    csvRows.push({
      building: row.building_name,
      type: typeInfo.type,
      number: typeInfo.number,
      owner,
      email,
      username,
      password: passwordPlain || "",
      status,
      source,
      reused: reused ? "yes" : "no",
      area,
      floor,
    });
    if (!isPreview && user?.id && building_id) {
      const propertyResult = await insertOrUpdateProperty(
        typeInfo.type,
        building_id,
        user.id,
        typeInfo.number,
        floor,
        area
      );

      console.log(
        `🏗️  ${typeInfo.type} #${typeInfo.number} → ${propertyResult.status}`
      );
    }

    // обобщение
    summary[typeInfo.type]++;
  }

  // генерираме CSV
  fs.mkdirSync("tools/import/output", { recursive: true });
  const csv = [
    "Building,Type,Number,Owner,Email,Username,Password,Status,Area,Floor",
    ...csvRows.map(
      (r) =>
        `"${r.building}",${r.type},${r.number},${r.owner},${r.email},${r.username},${r.password},${r.status},${r.area},${r.floor}`
    ),
  ].join("\n");

  fs.writeFileSync("tools/import/output/users_preview.csv", csv);

  console.log("\n📊 Резюме:");
  console.log(summary);
  console.log("📤 CSV файл: tools/import/output/users_preview.csv\n");
}

main();