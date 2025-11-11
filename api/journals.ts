import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { JournalEntry } from '../src/types'; // Kita bisa mengimpor tipe dari luar karena ini hanya untuk TypeScript
import { INITIAL_JOURNAL_ENTRIES } from '../src/constants';

// Inisialisasi klien Supabase
// Kunci ini aman digunakan di sisi server (serverless function).
// Pastikan Anda telah mengatur variabel lingkungan di Vercel.
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
            .from('journals')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        // 2. If the table is empty, seed it with initial data.
        if (count === 0) {
            const { error: insertError } = await supabase
                .from('journals')
                .insert(INITIAL_JOURNAL_ENTRIES);
            
            if (insertError) {
                console.error("Error seeding journals table:", insertError);
                throw insertError;
            }
        }
        
        // 3. Fetch and return all journal entries.
        const { data: journals, error: fetchError } = await supabase
            .from('journals')
            .select('*')
            .order('date', { ascending: false })
            .order('submissionTime', { ascending: false });

        if (fetchError) throw fetchError;
        
        return res.status(200).json(journals);
        
      } catch (error: any) {
        res.status(500).json({ message: 'Error fetching journals', error: error.message });
      }
      break;

    case 'POST':
      try {
        const newEntryData: Partial<JournalEntry> = req.body;
        
        // Data yang harus di-generate oleh server untuk konsistensi
        const entryToInsert = {
          ...newEntryData,
          date: new Date().toISOString().split('T')[0],
          submissionTime: new Date().toLocaleTimeString('id-ID', { hour12: false }),
          status: 'Pending',
        };

        const { data, error } = await supabase
          .from('journals')
          .insert(entryToInsert)
          .select()
          .single();

        if (error) throw error;
        res.status(201).json(data);
      } catch (error: any) {
        res.status(400).json({ message: 'Bad request: Invalid data format.', error: error.message });
      }
      break;
    
    case 'PUT':
      try {
        const updatedEntry: JournalEntry = req.body;
        const { id, ...updateData } = updatedEntry;

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
      } catch(error: any) {
        res.status(500).json({ message: 'Error deleting journal', error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
