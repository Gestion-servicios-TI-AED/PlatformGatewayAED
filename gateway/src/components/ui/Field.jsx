// PLANTILLA -- copiado tal cual, va en frontend/src/components/ui/Field.jsx.
// Este es el componente base de TODO formulario del producto (login
// incluido) -- si un proyecto nuevo lo reescribe desde cero en vez de
// copiarlo, la altura/padding/tipografia del input terminan LIGERAMENTE
// distintos sin que se note a simple vista hasta que se comparan lado a
// lado (encontrado como problema real: un proyecto copiado a mano perdio
// el padding exacto y la altura de los inputs quedo distinta). Copiar este
// archivo tal cual es la unica forma de garantizar 100% de paridad.
//
// Patron render-prop, no wrapper de input directo -- `children` es una
// funcion que recibe { id, aria-invalid, aria-describedby } ya resueltos,
// asi el mismo Field sirve para TextInput, Select, Textarea, o un widget
// custom. Ver ARQUITECTURA-FRONTEND.md, "Componente Field", para el patron
// completo y la especificacion exacta de medidas.
import { useId } from 'react';
import styles from './Field.module.css';

export function Field({ label, required, error, helper, children, className = '' }) {
  const id = useId();
  const child = children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined });

  return (
    <div className={`${styles.field} ${className}`}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {child}
      {error ? (
        <span id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </span>
      ) : helper ? (
        <span className={styles.helper}>{helper}</span>
      ) : null}
    </div>
  );
}

export function TextInput({ className = '', invalid, ...props }) {
  return <input className={`${styles.control} ${invalid ? styles.invalid : ''} ${className}`} {...props} />;
}

export function Textarea({ className = '', invalid, ...props }) {
  return <textarea className={`${styles.control} ${invalid ? styles.invalid : ''} ${className}`} {...props} />;
}

export function Select({ className = '', invalid, children, ...props }) {
  return (
    <select className={`${styles.control} ${invalid ? styles.invalid : ''} ${className}`} {...props}>
      {children}
    </select>
  );
}
