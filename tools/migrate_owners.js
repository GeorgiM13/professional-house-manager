// 📦 Edge Function: migrate-owners
// ✅ Прехвърля немигрирани собственици от owners_temp → users + Supabase Auth

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// 🔠 Умна функция за разделяне на имена
function splitName(fullName) {
  if (!fullName) {
    return { first_name: "", second_name: "", last_name: "" };
  }

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    // Едно име (напр. фирма)
    return { first_name: parts[0], second_name: "", last_name: "" };
  }

  if (parts.length === 2) {
    // Две имена (Иван Иванов)
    return { first_name: parts[0], second_name: "", last_name: parts[1] };
  }

  if (parts.length === 3) {
    // Три имена (Иван Георгиев Иванов)
    return { first_name: parts[0], second_name: parts[1], last_name: parts[2] };
  }

  // Повече от 3 думи (например фирма с име)
  return {
    first_name: parts[0],
    second_name: parts.slice(1, parts.length - 1).join(" "),
    last_name: parts[parts.length - 1],
  };
}

Deno.serve(async (req) => {
  try {
    // 🔐 Проверка за достъп
    const authHeader = req.headers.get("authorization");
    const expected = `Bearer ${SERVICE_ROLE_KEY}`;
    if (authHeader !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🚀 Стартиране на миграцията на собственици...");

    // 1️⃣ Вземаме немигрираните записи
    const { data: owners, error: fetchError } = await supabase
      .from("owners_temp")
      .select("*")
      .eq("migrated", false);

    if (fetchError) throw new Error(fetchError.message);

    if (!owners || owners.length === 0) {
      return new Response(JSON.stringify({ message: "Няма нови записи за миграция." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📋 Намерени ${owners.length} собственика за миграция`);

    const results = [];

    for (const owner of owners) {
      if (!owner.email) {
        console.warn(`⚠️ Пропуснат запис без имейл: ${owner.name}`);
        continue;
      }

      // 2️⃣ Създаваме Auth акаунт
      const tempPassword = Math.random().toString(36).slice(-8);
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: owner.email,
        email_confirm: true,
        password: tempPassword,
        phone: owner.phone || null,
        user_metadata: {
          name: owner.name,
          building_id: owner.building_id,
          object_type: owner.object_type,
          object_number: owner.object_number,
        },
      });

      if (authError) {
        console.error(`❌ Auth грешка при ${owner.email}: ${authError.message}`);
        continue;
      }

      console.log(`✅ Auth акаунт създаден за ${owner.email}`);

      // 3️⃣ Разделяме името интелигентно
      const { first_name, second_name, last_name } = splitName(owner.name);

      // 4️⃣ Добавяме в таблицата users
      const { error: userError } = await supabase.from("users").insert({
        id: authUser.user.id,
        first_name,
        second_name,
        last_name,
        email: owner.email,
        username: owner.email,
        phone: owner.phone,
        role: "user",
      });

      if (userError) {
        console.error(`❌ Грешка при добавяне в users: ${userError.message}`);
        continue;
      }

      // 5️⃣ Маркираме като мигриран
      const { error: updateError } = await supabase
        .from("owners_temp")
        .update({ migrated: true })
        .eq("id", owner.id);

      if (updateError) {
        console.error(`⚠️ Неуспешно маркиране на ${owner.email}: ${updateError.message}`);
      } else {
        console.log(`🟢 ${owner.email} е мигриран успешно`);
      }

      results.push({
        email: owner.email,
        password: tempPassword,
        name: owner.name,
      });
    }

    // 6️⃣ Връщаме обобщение
    return new Response(JSON.stringify({ success: true, created: results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Грешка при миграцията:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
