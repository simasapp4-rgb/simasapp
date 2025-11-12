
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { role, identifier, password } = request.body;

  if (!role || !identifier || !password) {
    return response.status(400).json({ error: 'Role, identifier, and password are required' });
  }

  let userColumn = '';
  switch (role) {
    case 'STUDENT': userColumn = 'nisn'; break;
    case 'TEACHER': userColumn = 'nip'; break;
    case 'PARENT': userColumn = 'nik'; break;
    case 'ADMIN': userColumn = 'nip'; break;
    default: return response.status(400).json({ error: 'Invalid role specified' });
  }

  try {
    // Note: Supabase queries are case-sensitive by default.
    // We fetch the user by their identifier first.
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .eq(userColumn, identifier)
      .limit(1);

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return response.status(500).json({ error: 'Database query failed' });
    }

    if (users && users.length > 0) {
        const user = users[0];
        // Now, we perform a case-insensitive password comparison in code.
        if (user.password.toLowerCase() === password.toLowerCase()) {
            // On successful login, return the full user object
            return response.status(200).json(user);
        } else {
            // Password mismatch
            return response.status(401).json({ error: 'Invalid identifier or password' });
        }
    } else {
        // User not found
        return response.status(401).json({ error: 'Invalid identifier or password' });
    }

  } catch (e) {
    const error = e as Error;
    console.error('Login handler error:', error);
    return response.status(500).json({ error: 'An unexpected error occurred', details: error.message });
  }
}
