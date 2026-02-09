import { createClient } from '@/app/utils/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Metadata } from 'next';
import FeedbackForm from './components/FeedbackForm';

export const metadata: Metadata = {
    title: 'Feedback - DeckSage',
    description: 'Envie suas sugestões, elogios ou reporte problemas para a equipe do DeckSage.',
};

export default async function FeedbackPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userName = '';
    let userEmail = '';

    if (user) {
        // Try to get name from metadata or profile
        userName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        userEmail = user.email || '';

        if (!userName) {
            const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
            if (profile) userName = profile.name;
        }
    }

    return (
        <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <Card className="w-full max-w-md bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-amber-500">Deixe seu Feedback</CardTitle>
                    <CardDescription className="text-center text-neutral-400">
                        Sua opinião é fundamental para evoluirmos o DeckSage.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FeedbackForm user={user} userName={userName} userEmail={userEmail} />
                </CardContent>
            </Card>
        </div>
    );
}
