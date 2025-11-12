import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { User } from '../src/types';
import { USERS as INITIAL_USERS } from '../src/constants.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be defined in environment variables.");
}

// Definitive fix for caching: Force all Supabase requests to bypass cache
const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'Cache-Control': 'no-store',
    },
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // This header is still good practice for browser-side caching.
  res.setHeader('Cache-Control', 'no-store'); 

  switch (req.method) {
    case 'GET':
      try {
        const { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        if (count === 0) {
            const { error: insertError } = await supabase
                .from('users')
                .insert(INITIAL_USERS);
            
            if (insertError) {
                console.error("Error seeding users table:", insertError);
                throw insertError;
            }
        }
        
        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .order('name', { ascending: true });

        if (fetchError) throw fetchError;
        
        return res.status(200).json(users);
        
      } catch (error: any) {
        console.error('Error in GET /api/users:', error);
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
         res.status(400).json({ message: 'Bad request: Invalid data format.', error: error.message });
      }
      break;

    case 'DELETE':
      const { id, action } = req.query;
      if (action === 'reset_application_data') {
        try {
          const serviceKey = process.env.SUPABASE_SERVICE_KEY;
          if (!serviceKey) throw new Error('Service key is not configured.');
          const supabaseAdmin = createClient(supabaseUrl, serviceKey);
          
          await supabaseAdmin.from('journals').delete().neq('id', '0');
          await supabaseAdmin.from('users').delete().neq('id', '0');
          
          return res.status(200).json({ message: 'All application data has been reset.' });
        } catch(error: any) {
          return res.status(500).json({ message: 'Error resetting data', error: error.message });
        }
      } else {
        try {
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
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
