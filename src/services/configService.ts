/**
 * Utilitário para obter parâmetros de configuração da URL
 * Permite passar chave e outras configurações sem expor no código
 * 
 * Uso: https://site.com/dashboard/?chave=xxx&unidade=123
 */

class ConfigService {
  private urlParams: URLSearchParams;

  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
  }

  /**
   * Obtém a chave de autenticação
   * Prioridade: URL > .env
   */
  getChave(): string | null {
    const chaveUrl = this.urlParams.get('chave');
    if (chaveUrl) {
      return chaveUrl;
    }
    return (import.meta.env as any).VITE_CHAVE || null;
  }

  /**
   * Obtém a unidade de negócio
   * Prioridade: URL > .env > padrão
   */
  getUnidadeNegocio(): string {
    const unidadeUrl = this.urlParams.get('unidade');
    if (unidadeUrl) {
      return unidadeUrl;
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
