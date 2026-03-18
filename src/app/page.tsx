import { redirect } from 'next/navigation'

// La raíz redirige al middleware que decide a dónde va según el rol.
// Si no hay sesión, el middleware enviará a /login.
export default function Home() {
  redirect('/')
}
