import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { LogIn, UserPlus } from 'lucide-react'
import api from '../services/api.js'
import { BackendUrlChanger } from './BackendUrlChanger'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function LoginPage() {
  const { login } = useAuth() // Usar o login do contexto de autenticação
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'visitante'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔍 Iniciando processo de login...')
      
      if (isLogin) {
        console.log('🔍 Dados sendo enviados:', {
          username: formData.username,
          password: formData.password
        })
        
        console.log('🔍 Fazendo requisição para:', '/auth/login')
        console.log('🔍 Headers:', {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        })
        
        const response = await api.post('/auth/login', {
          username: formData.username,
          password: formData.password
        })
        
        console.log('✅ Resposta recebida:', response)
        console.log('✅ Status da resposta:', response.status)
        console.log('✅ Data da resposta:', response.data)
        
        const { token, user } = response.data
        console.log('✅ Token extraído:', token)
        console.log('✅ User extraído:', user)
        
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        console.log('✅ Dados salvos no localStorage')
        
        // Usar a função login do contexto de autenticação
        if (typeof login === 'function') {
          login(user)
          console.log('✅ Login concluído com sucesso')
        } else {
          console.log('✅ Login concluído - recarregando página para atualizar estado')
          window.location.reload()
        }
      } else {
        const response = await api.post('/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
        
        setIsLogin(true)
        setError('')
        alert('Usuário criado com sucesso! Faça login agora.')
      }
    } catch (err) {
      console.error('❌ Erro capturado:', err)
      console.error('❌ Erro response:', err.response)
      console.error('❌ Erro message:', err.message)
      console.error('❌ Erro code:', err.code)
      console.error('❌ Erro config:', err.config)
      
      setError(err.response?.data?.message || 'Erro ao processar solicitação')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
      {/* Botão para alterar URL do backend */}
      <BackendUrlChanger variant="login" />

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Espaço para a logo */}
          <div className="mb-4 flex justify-center">
            <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-20 h-20 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-20 h-20 bg-gray-300 rounded-lg items-center justify-center text-gray-500 text-xs">
                Logo
              </div>
            </div>
          </div>

          <CardTitle className="text-2xl font-bold">
            {isLogin ? 'Login' : 'Cadastro'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Entre com suas credenciais para acessar o sistema'
              : 'Crie uma nova conta para acessar o sistema'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Digite seu usuário"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Digite seu email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Usuário</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="visitante">Visitante</option>
                  <option value="marceneiro">Marceneiro</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processando...' : (
                <>
                  {isLogin ? <LogIn className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {isLogin ? 'Entrar' : 'Cadastrar'}
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setFormData({
                  username: '',
                  email: '',
                  password: '',
                  role: 'visitante'
                })
              }}
            >
              {isLogin 
                ? 'Não tem conta? Cadastre-se'
                : 'Já tem conta? Faça login'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

