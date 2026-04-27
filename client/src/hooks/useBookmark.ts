import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export function useBookmark(jobId: number) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !jobId) return;
    api.get(`/bookmarks/check/${jobId}`)
      .then(({ data }) => setBookmarked(data.bookmarked))
      .catch(() => {});
  }, [user, jobId]);

  const toggle = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (bookmarked) {
        await api.delete(`/bookmarks/${jobId}`);
        setBookmarked(false);
      } else {
        await api.post('/bookmarks', { job_id: jobId });
        setBookmarked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return { bookmarked, toggle, loading };
}
