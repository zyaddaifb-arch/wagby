import { login } from './src/app/auth/actions.js';
import { FormData } from 'undici';

async function test() {
  const fd = new FormData();
  fd.append('email', 'teacher@example.com');
  fd.append('password', 'password123');
  
  try {
    const res = await login(fd);
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
test();
