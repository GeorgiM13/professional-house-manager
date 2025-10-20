import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function changePassword(userId, newPassword) {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
    });

    if (error) {
        console.error('Грешка при смяна на паролата:', error);
    } else {
        console.log(`Паролата на потребител ${userId} е сменена успешно.`);
    }
}

async function confirmUserEmail(userId) {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        email_confirm: true
    });

    if (error) {
        console.error('Грешка при потвърждаване на акаунта:', error);
    } else {
        console.log('Акаунтът е потвърден успешно:', data);
    }
}

confirmUserEmail('e15f9bca-4c17-4e15-8394-6dba97e222c5');
changePassword('e15f9bca-4c17-4e15-8394-6dba97e222c5', 'Georgi2003');




