
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { User } from '../src/types';
import { INITIAL_USERS } from '../src/constants';

// Inisialisasi klien Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be defined in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set headers to prevent caching on all responses from this endpoint
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  switch (req.method) {
    case 'GET':
      try {
        // Cek apakah tabel pengguna kosong
        const { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        // Jika kosong, isi dengan data awal
        if (count === 0) {
            const { error: insertError } = await supabase
                .from('users')
                .insert(INITIAL_USERS);
            if (insertError) throw insertError;
        }
        
        // Ambil semua data pengguna
        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .order('name', { ascending: true });

        if (fetchError) throw fetchError;
        
        return res.status(200).json(users);
        
      } catch (error: any) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
      }
      break;

    case 'POST':
      try {
        const newUser: User = req.body;
        const { data, error } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();

        if (error) throw error;
        res.status(201).json(data);
      } catch (error: any) {
        res.status(400).json({ message: 'Bad request', error: error.message });
      }
      break;
    
    case 'PUT':
      try {
        const updatedUser: User = req.body;
        const { id, ...updateData } = updatedUser;

        if (!id) {
          return res.status(400).json({ message: 'Bad request: Missing user ID.' });
        }

        const { data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'User not found' });
        
        res.status(200).json(data);
      } catch (error: any) {
         res.status(400).json({ message: 'Bad request', error: error.message });
      }
      break;

    case 'DELETE':
      try {
        // Handle reset data khusus
        if (req.query.action === 'reset_application_data') {
            await supabase.from('journals').delete().neq('id', '0'); // Hapus semua kecuali dummy
            await supabase.from('users').delete().neq('id', '0');
            await supabase.from('users').insert(INITIAL_USERS);
            return res.status(200).json({ message: 'Application data has been reset.' });
        }
          
        const { id } = req.query;
        if (typeof id !== 'string') {
          return res.status(400).json({ message: 'Bad request: Missing or invalid id.' });
        }

        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'User deleted successfully' });
      } catch(error: any) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
