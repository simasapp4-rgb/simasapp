import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { JournalEntry } from '../src/types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be defined in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-cache');

  switch (req.method) {
    case 'GET':
      try {
        const { data, error } = await supabase
          .from('journals')
          .select('*')
          .order('date', { ascending: false });
        if (error) throw error;
        res.status(200).json(data);
      } catch (error: any) {
        res.status(500).json({ message: 'Error fetching journals', error: error.message });
      }
      break;

    case 'POST':
      try {
        const newJournal: Partial<JournalEntry> = req.body;
        const { data, error } = await supabase
          .from('journals')
          .insert(newJournal)
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
        const updatedJournal: JournalEntry = req.body;
        const { id, ...updateData } = updatedJournal;
        if (!id) {
          return res.status(400).json({ message: 'Bad request: Missing journal ID.' });
        }

        const { data, error } = await supabase
          .from('journals')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
          
        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Journal not found' });

        res.status(200).json(data);
      } catch (error: any) {
        res.status(400).json({ message: 'Bad request: Invalid data format.', error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;
        if (typeof id !== 'string') {
          return res.status(400).json({ message: 'Bad request: Missing or invalid id.' });
        }

        const { error } = await supabase
          .from('journals')
          .delete()
          .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'Journal deleted successfully' });
      } catch (error: any) {
        res.status(500).json({ message: 'Error deleting journal', error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
