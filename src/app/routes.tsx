import { Routes, Route } from 'react-router-dom';
import { HomeRoute } from '@/features/page/HomeRoute';
import { PageRoute } from '@/features/page/PageRoute';
import { StatsRoute } from '@/features/stats/StatsRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/p/:slug" element={<PageRoute />} />
      <Route path="/p/:slug/stats" element={<StatsRoute />} />
    </Routes>
  );
}
