
import { useState } from 'react';
import api from '../../services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tipoAcesso, setTipoAcesso] = useState('visitante');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/auth/register', {
        username,
        email,
        password,
        tipo_acesso: tipoAcesso,
      });
      setSuccess(response.data.message + '. Você pode fazer login agora.');
      setUsername('');
      setEmail('');
      setPassword('');
      setTipoAcesso('visitante');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao registrar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Usuário:</label>
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-1 block w-full"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Email:</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Senha:</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo de Acesso:</label>
        <Select value={tipoAcesso} onValueChange={setTipoAcesso}>
          <SelectTrigger className="mt-1 block w-full">
            <SelectValue placeholder="Selecione o tipo de acesso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="administrador">Administrador</SelectItem>
            <SelectItem value="marceneiro">Marceneiro</SelectItem>
            <SelectItem value="visitante">Visitante</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-500 text-sm">{success}</div>}
      
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Registrando...' : 'Registrar'}
      </Button>
    </form>
  );
};

export default RegisterForm;


