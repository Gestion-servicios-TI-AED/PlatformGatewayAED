import { useMemo, useState } from 'react';
import { ReactLenis } from 'lenis/react';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from './components/ui/Badge.jsx';
import { TextInput } from './components/ui/Field.jsx';
import { APPS } from './apps.js';
import styles from './App.module.css';

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[0300-036f]/g, '').toLowerCase();
}

function AppCard({ app }) {
  const Icono = app.icono;
  const disponible = app.estado === 'disponible';

  const contenido = (
    <>
      <div className={styles.cardTop}>
        <span className={styles.icon}>
          <Icono size={20} strokeWidth={1.75} aria-hidden="true" />
        </span>
        {disponible ? (
          <Badge variant="success" dot>
            Disponible
          </Badge>
        ) : (
          <Badge variant="neutral">Próximamente</Badge>
        )}
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{app.nombre}</h3>
        <p className={styles.cardText}>{app.descripcion}</p>
      </div>
      {disponible && (
        <span className={styles.cardAction}>
          Abrir aplicación
          <ArrowUpRight size={16} strokeWidth={1.75} className={styles.arrow} aria-hidden="true" />
        </span>
      )}
    </>
  );

  if (disponible) {
    return (
      <a className={`${styles.card} ${styles.cardLive}`} href={app.href}>
        {contenido}
      </a>
    );
  }
  return (
    <div className={`${styles.card} ${styles.cardSoon}`} aria-disabled="true">
      {contenido}
    </div>
  );
}

function Seccion({ titulo, apps }) {
  if (apps.length === 0) return null;
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{titulo}</h2>
      <div className={styles.grid}>
        {apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [busqueda, setBusqueda] = useState('');

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (!q) return APPS;
    return APPS.filter((a) => normalizar(`${a.nombre} ${a.area} ${a.descripcion}`).includes(q));
  }, [busqueda]);

  const disponibles = filtradas.filter((a) => a.estado === 'disponible');
  const proximamente = filtradas.filter((a) => a.estado !== 'disponible');

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <img className={styles.brandLogo} src="/aed-logo.png" alt="aed" />
          <span className={styles.brandDivider} aria-hidden="true" />
          <span className={styles.brandName}>Plataforma</span>
        </div>
      </header>

      <ReactLenis root={false} className={styles.scrollArea} options={{ smoothWheel: true }}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Aplicaciones</h1>
            <p className={styles.hint}>Elige la aplicación a la que quieres acceder.</p>
          </div>
          <TextInput
            type="search"
            className={styles.search}
            placeholder="Buscar aplicación…"
            aria-label="Buscar aplicación"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {filtradas.length === 0 ? (
          <p className={styles.empty}>No hay aplicaciones que coincidan con “{busqueda}”.</p>
        ) : (
          <>
            <Seccion titulo="Disponibles" apps={disponibles} />
            <Seccion titulo="Próximamente" apps={proximamente} />
          </>
        )}
      </ReactLenis>
    </div>
  );
}
