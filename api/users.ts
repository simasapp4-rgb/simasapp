import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { User } from '../src/types';
import { USERS, INITIAL_JOURNAL_ENTRIES } from '../src/constants';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be defined in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      try {
        // PRODUCTION-READY STRATEGY: Seed data only if the table is empty.
        // 1. Check if there's any data in the table.
        const { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        // 2. If the table is empty, seed it with initial data.
        if (count === 0) {
            const { error: insertError } = await supabase
                .from('users')
                .insert(USERS);
            
            if (insertError) {
                console.error("Error seeding users table:", insertError);
                throw insertError;
            }
        }
        
        // 3. Fetch and return all user entries.
        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .order('name', { ascending: true });

        if (fetchError) throw fetchError;

        res.status(200).json(users);

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

        if (error) {
            console.error('Supabase insert error:', error);
            return res.status(400).json({ message: error.message });
        }
        res.status(201).json(data);
      } catch (error: any) {
        res.status(400).json({ message: 'Bad request: Invalid user data.', error: error.message });
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

        if (error) {
            console.error('Supabase update error:', error);
            return res.status(400).json({ message: error.message });
        }
        if (!data) return res.status(404).json({ message: 'User not found' });
        
        res.status(200).json(data);
      } catch (error: any) {
         res.status(400).json({ message: 'Bad request: Invalid user data.', error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const { id, action } = req.query;

        // Handle Application Data Reset
        if (action === 'reset_application_data') {
            // 1. Delete all existing data from journals and users table
            const { error: journalDeleteError } = await supabase.from('journals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (journalDeleteError) throw new Error(`Failed to clear journals: ${journalDeleteError.message}`);
            
            const { error: userDeleteError } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (userDeleteError) throw new Error(`Failed to clear users: ${userDeleteError.message}`);

            // 2. Re-seed the tables with initial data
            const { error: journalSeedError } = await supabase.from('journals').insert(INITIAL_JOURNAL_ENTRIES);
            if (journalSeedError) throw new Error(`Failed to seed journals: ${journalSeedError.message}`);

            const { error: userSeedError } = await supabase.from('users').insert(USERS);
            if (userSeedError) throw new Error(`Failed to seed users: ${userSeedError.message}`);
            
            return res.status(200).json({ message: 'Application data has been reset successfully.' });
        }
        
        // Handle single user deletion
        if (typeof id !== 'string') {
          return res.status(400).json({ message: 'Bad request: Missing or invalid id.' });
        }

        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id);

        if (error) {
            console.error('Supabase delete error:', error);
            return res.status(500).json({ message: error.message });
        }
        res.status(200).json({ message: 'User deleted successfully' });
      } catch(error: any) {
        res.status(500).json({ message: 'Error during DELETE operation', error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
