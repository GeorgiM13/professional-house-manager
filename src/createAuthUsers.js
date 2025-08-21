import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vjwxfbvmznvrfcaekqqo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqd3hmYnZtem52cmZjYWVrcXFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2MDQ4NiwiZXhwIjoyMDcwNzM2NDg2fQ.WvtEif7wwIjhHVajvpywuBFU-WAR_vNhF9CuT08RyMM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAuthUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error('Грешка при взимане на users:', error);
        return;
    }

    for (const user of users) {
        const email = user.email || `${user.username}@example.com`;
        const password = user.password; 

        const { data, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            user_metadata: {
            username: user.username,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name
            }
        });

        if (authError) {
            console.error(`Грешка при създаване на ${user.username}:`, authError);
        } else {
            console.log(`Създаден потребител: ${user.username}`);
        }
    } 
}

createAuthUsers();
