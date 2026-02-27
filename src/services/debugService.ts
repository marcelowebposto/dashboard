/**
 * Utilitário para testar a integração com o backend
 * Execute no console do navegador: import('/@fs/...').then(m => m.testBackendIntegration())
 */

import authService from './authService';
import pdvService from './pdvService';

export async function testBackendIntegration() {
  console.log('🧪 Iniciando testes de integração com o backend...\n');

  try {
    // Teste 1: Obter token
    console.log('📍 Teste 1: Obtendo token JWT...');
    const token = await authService.getToken();
    console.log('✅ Token obtido com sucesso');
    console.log('Token preview:', token.substring(0, 50) + '...');

    // Teste 2: Decodificar token
    console.log('\n📍 Teste 2: Decodificando informações do token...');
    const userInfo = await authService.getUserInfo();
    console.log('✅ Informações do usuário:');
    console.table(userInfo);

    // Teste 3: Buscar caixas desconsolidados
    console.log('\n📍 Teste 3: Buscando caixas desconsolidados...');
    const caixas = await pdvService.getCaixasDesconsolidados();
    console.log(`✅ ${caixas.length} caixas retornados`);
    console.table(caixas.slice(0, 5));

    // Teste 4: Buscar indicadores (com nomes de empresas)
    console.log('\n📍 Teste 4: Convertendo para indicadores com empresas...');
    const indicadores = await pdvService.getIndicadores();
    console.log(`✅ ${indicadores.length} indicadores processados`);
    console.table(indicadores.slice(0, 5));

    console.log('\n✅ Todos os testes completados com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Auto-export para facilitar testes
export default { testBackendIntegration };
