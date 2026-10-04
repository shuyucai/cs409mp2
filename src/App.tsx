import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { PokedexProvider } from './context/PokedexProvider';
import { DetailView } from './pages/DetailView/DetailView';
import { GalleryView } from './pages/GalleryView/GalleryView';
import { ListView } from './pages/ListView/ListView';
import { NotFound } from './pages/NotFound/NotFound';

export default function App() {
  return (
    <PokedexProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<ListView />} />
            <Route path="gallery" element={<GalleryView />} />
            <Route path="pokemon/:id" element={<DetailView />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PokedexProvider>
  );
}
