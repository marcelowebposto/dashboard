/**
 * Utilitário para obter parâmetros de configuração da URL
 * Permite passar chave e outras configurações sem expor no código
 * 
 * Uso: https://site.com/dashboard/?chave=xxx&unidade=123
 */

import axios from 'axios';

// Cache da primeira empresa encontrada
let primeiraEmpresaCache: string | null = null;
let primeiraEmpresaCacheChave: string | null = null;

class ConfigService {
  /**
   * Obtém os parâmetros da URL atual (sempre atualizado)
   */
  private getUrlParams(): URLSearchParams {
    return new URLSearchParams(window.location.search);
  }

  /**
   * Obtém a chave de autenticação
   * Prioridade: URL > .env
   */
  getChave(): string | null {
    const chaveUrl = this.getUrlParams().get('chave');
    if (chaveUrl) {
      return chaveUrl;
    }
    return (import.meta.env as any).VITE_CHAVE || null;
  }

  /**
   * Obtém a unidade de negócio da URL (se fornecida)
   */
  getUnidadeNegocioUrl(): string | null {
    return this.getUrlParams().get('unidade');
  }

  /**
   * Busca a primeira empresa disponível para usar como unidade de negócio
   */
  async getPrimeiraEmpresa(): Promise<string> {
    const chaveAtual = this.getChave();
    
    // Invalida cache se chave mudou
    if (primeiraEmpresaCacheChave !== chaveAtual) {
      primeiraEmpresaCache = null;
      primeiraEmpresaCacheChave = chaveAtual;
    }
    
    // Retorna cache se disponível
    if (primeiraEmpresaCache) {
      return primeiraEmpresaCache;
    }
    
    // Se tem unidade na URL, usa ela
    const unidadeUrl = this.getUnidadeNegocioUrl();
    if (unidadeUrl) {
      primeiraEmpresaCache = unidadeUrl;
      return unidadeUrl;
    }
    
    // Busca empresas para pegar a primeira
    try {
      const apiUrl = this.getApiUrl();
      const chave = this.getChave();
      
      if (!chave) {
        throw new Error('Chave não configurada');
      }
      
      console.log('[ConfigService] Buscando primeira empresa...');
      const response = await axios.get(`${apiUrl}/INTEGRACAO/EMPRESAS?chave=${chave}`, {
        timeout: 10000,
      });
      
      if (response.data?.resultados?.length > 0) {
        const primeiraEmpresa = response.data.resultados[0].empresaCodigo;
        console.log('[ConfigService] Primeira empresa encontrada:', primeiraEmpresa);
        primeiraEmpresaCache = String(primeiraEmpresa);
        return primeiraEmpresaCache;
      }
      
      throw new Error('Nenhuma empresa encontrada');
    } catch (error) {
      console.error('[ConfigService] Erro ao buscar primeira empresa:', error);
      // Fallback para valor do .env ou padrão
      return (import.meta.env as any).VITE_UNIDADE_NEGOCIO || '55229';
    }
  }

  /**
   * Obtém a unidade de negócio (síncrono - usa cache ou fallback)
   * @deprecated Use getPrimeiraEmpresa() para garantir valor correto
   */
  getUnidadeNegocio(): string {
    const unidadeUrl = this.getUrlParams().get('unidade');
    if (unidadeUrl) {
      return unidadeUrl;
    }
    if (primeiraEmpresaCache) {
      return primeiraEmpresaCache;
    }
    return (import.meta.env as any).VITE_UNIDADE_NEGOCIO || '55229';
  }

  /**
   * Obtém a URL base da API
   */
  getApiUrl(): string {
    return (import.meta.env as any).VITE_API_URL || 'http://localhost:8080';
  }

  /**
   * Verifica se a chave está configurada
   */
  hasChave(): boolean {
    return !!this.getChave();
  }

  /**
   * Gera URL de compartilhamento com os parâmetros
   */
  gerarUrlCompartilhamento(): string {
    const chave = this.getChave();
    const unidade = this.getUnidadeNegocio();
    const baseUrl = window.location.origin + window.location.pathname;
    
    const params = new URLSearchParams();
    if (chave) params.set('chave', chave);
    if (unidade !== '55229') params.set('unidade', unidade);
    
    return `${baseUrl}?${params.toString()}`;
  }
}

// Instância singleton
const configService = new ConfigService();
export default configService;
