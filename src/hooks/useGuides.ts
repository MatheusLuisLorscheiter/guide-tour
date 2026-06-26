import { useState, useEffect } from 'react';
import { supabase, Category, Guide, Step } from '../lib/supabase';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useGuides(categoryId?: string) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        let query = supabase
          .from('guides')
          .select('*, category:categories(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setGuides(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, [categoryId]);

  return { guides, loading, error };
}

export function useGuide(guideId: string) {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const { data, error } = await supabase
          .from('guides')
          .select('*, category:categories(*)')
          .eq('id', guideId)
          .single();

        if (error) throw error;
        setGuide(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (guideId) {
      fetchGuide();
    }
  }, [guideId]);

  return { guide, loading, error };
}

export function useSteps(guideId: string) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        const { data, error } = await supabase
          .from('steps')
          .select('*, media:step_media(*)')
          .eq('guide_id', guideId)
          .order('step_number', { ascending: true });

        if (error) throw error;
        setSteps(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (guideId) {
      fetchSteps();
    }
  }, [guideId]);

  return { steps, loading, error };
}

export function useUserProgress(guideId: string) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_progress')
        .select('step_id')
        .eq('user_id', user.id)
        .eq('guide_id', guideId);

      setCompletedSteps(data?.map((p) => p.step_id) || []);
      setLoading(false);
    };

    if (guideId) {
      fetchProgress();
    }
  }, [guideId]);

  const toggleStepComplete = async (stepId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isCompleted = completedSteps.includes(stepId);

    if (isCompleted) {
      await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('guide_id', guideId)
        .eq('step_id', stepId);

      setCompletedSteps((prev) => prev.filter((id) => id !== stepId));
    } else {
      await supabase.from('user_progress').insert({
        user_id: user.id,
        guide_id: guideId,
        step_id: stepId,
      });

      setCompletedSteps((prev) => [...prev, stepId]);
    }
  };

  return { completedSteps, loading, toggleStepComplete };
}

export async function incrementGuideViews(guideId: string) {
  const { error } = await supabase.rpc('increment_views', { guide_id: guideId });
  if (error) {
    // If the RPC doesn't exist, do a manual update
    await supabase
      .from('guides')
      .update({ views_count: supabase.rpc('increment', { count: 'views_count' }) })
      .eq('id', guideId);
  }
}
