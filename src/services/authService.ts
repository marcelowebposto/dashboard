import axios from 'axios';
import configService from './configService';

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_TOKEN_ENDPOINT?: string;
  readonly VITE_CHAVE?: string;
  readonly VITE_UNIDADE_NEGOCIO?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface DecodedToken {
  TOK_CD_USUARIO: number;
  TOK_CD_REDE: number;
  TOK_CD_PERFIL: number;
  TOK_CD_UNIDADE_NEGOCIO: number;
  exp: number;
  iss: string;
}

class AuthService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private tokenChave: string | null = null; // Chave usada para obter o token
  private tokenRefreshBuffer = 30; // renovar 30s antes de expirar

  private getApiUrl() {
    return configService.getApiUrl();
  }

  private getTokenEndpoint() {
    return (import.meta.env as unknown as ImportMetaEnv).VITE_TOKEN_ENDPOINT || '/INTEGRACAO/TOKEN_RETAGUARDA';
  }

  private getChave() {
    return configService.getChave();
  }

  /**
   * Invalida o token se a chave mudou
   */
  private checkChaveChanged() {
    const chaveAtual = this.getChave();
    if (this.tokenChave !== null && this.tokenChave !== chaveAtual) {
      console.log('[AuthService] Chave mudou, invalidando token');
      this.token = null;
      this.tokenExpiry = null;
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('tokenChave');
    }
    this.tokenChave = chaveAtual;
  }

  /**
   * Faz login e obtém um novo token JWT
   */
  async login(): Promise<string> {
    try {
      this.checkChaveChanged();
      
      const apiUrl = this.getApiUrl();
      const endpoint = this.getTokenEndpoint();
      const chave = this.getChave();
      
      // Busca a primeira empresa para usar como unidade de negócio
      const unidade = await configService.getPrimeiraEmpresa();

      if (!chave) {
        throw new Error('Chave não configurada. Acesse com ?chave=SUA_CHAVE na URL');
      }

      const url = `${apiUrl}${endpoint}/${unidade}?CHAVE=${chave}`;

      console.log('[AuthService] Fazendo login em:', url);

      const response = await axios.get<TokenResponse>(url, {
        timeout: 10000,
      });

      if (!response.data.access_token) {
        throw new Error('Token não recebido do servidor');
      }

      console.log('[AuthService] Token obtido com sucesso. Expira em:', response.data.expires_in, 's');

      this.setToken(response.data.access_token, response.data.expires_in);
      return response.data.access_token;
    } catch (error) {
      console.error('[AuthService] Erro ao fazer login:', error);
      throw error;
    }
  }

  /**
   * Define o token e define quando ele vai expirar
   */
  private setToken(token: string, expiresIn: number) {
    this.token = token;
    // Calcula o timestamp de expiração
    this.tokenExpiry = Date.now() + expiresIn * 1000;
    this.tokenChave = this.getChave();
    
    // Salva no localStorage para persistência
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiry', this.tokenExpiry.toString());
    if (this.tokenChave) {
      localStorage.setItem('tokenChave', this.tokenChave);
    }
  }

  /**
   * Restaura o token do localStorage (se ainda for válido)
   */
  private restoreToken() {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('tokenExpiry');
    const savedChave = localStorage.getItem('tokenChave');
    const currentChave = this.getChave();

    // Não restaura se a chave mudou
    if (savedChave !== currentChave) {
      console.log('[AuthService] Chave diferente do token salvo, ignorando cache');
      return false;
    }

    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10);
      
      // Verifica se o token ainda é válido
      if (Date.now() < expiryTime) {
        this.token = token;
        this.tokenExpiry = expiryTime;
        this.tokenChave = savedChave;
        return true;
      }
    }

    return false;
  }

  /**
   * Obtém o token válido, renovando se necessário
   */
  async getToken(): Promise<string> {
    // Verifica se a chave mudou
    this.checkChaveChanged();
    
    // Tenta restaurar de localStorage
    if (!this.token) {
      this.restoreToken();
    }

    // Verifica se o token é válido
    if (this.token && this.tokenExpiry) {
      const agora = Date.now();
      const bufferMs = this.tokenRefreshBuffer * 1000;

      // Se falta menos de 30s para expirar, renova
      if (this.tokenExpiry - agora > bufferMs) {
        return this.token;
      }
    }

    // Token não existe ou expirou, faz novo login
    return await this.login();
  }

  /**
   * Limpa o token armazenado
   */
  logout() {
    this.token = null;
    this.tokenExpiry = null;
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
  }

  /**
   * Decodifica o token JWT (sem validação de assinatura)
   */
  decodeToken(token: string): DecodedToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const decoded = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      );

      return decoded as DecodedToken;
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  }

  /**
   * Obtém as informações do usuário do token
   */
  async getUserInfo(): Promise<DecodedToken | null> {
    const token = await this.getToken();
    return this.decodeToken(token);
  }
}

export default new AuthService();
