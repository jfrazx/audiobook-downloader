import { useState } from 'react';
import { useLoginMutation } from './auth.api';

export function LoginForm() {
  const [login, { isLoading }] = useLoginMutation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password }).unwrap();
    } catch (err) {
      console.error('Failed to login:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username</label>
        <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      <a href="/api/auth/oidc">Login with OIDC</a>
    </form>
  );
}
