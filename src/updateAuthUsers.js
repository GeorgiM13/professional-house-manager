import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vjwxfbvmznvrfcaekqqo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqd3hmYnZtem52cmZjYWVrcXFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2MDQ4NiwiZXhwIjoyMDcwNzM2NDg2fQ.WvtEif7wwIjhHVajvpywuBFU-WAR_vNhF9CuT08RyMM';
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

confirmUserEmail('599e0fd0-8bbb-4772-a57b-10df2e72e0db');
changePassword('e15f9bca-4c17-4e15-8394-6dba97e222c5', 'Georgi2003');




