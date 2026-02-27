/**
 * Ferramenta de teste - adicione ao window.testAPI
 * Execute no console: window.testAPI.testTudo()
 */

import authService from './authService';
import pdvService from './pdvService';

export const testAPI = {
  async testToken() {
    console.log('🔑 Testando token...');
    try {
      const token = await authService.getToken();
      console.log('✅ Token obtido com sucesso!');
      console.log('Token preview:', token.substring(0, 50) + '...');
      return token;
    } catch (error) {
      console.error('❌ Erro ao obter token:', error);
      throw error;
    }
  },

  async testCaixas() {
    console.log('📦 Testando endpoint de caixas...');
    try {
      const caixas = await pdvService.getCaixasDesconsolidados();
      console.log('✅ Caixas obtidos com sucesso!');
      console.log(`Total de registros: ${caixas.length}`);
      console.table(caixas.slice(0, 3));
      return caixas;
    } catch (error) {
      console.error('❌ Erro ao buscar caixas:', error);
      throw error;
    }
  },

  async testIndicadores() {
    console.log('🏢 Testando indicadores (com nomes de empresas)...');
    try {
      const indicadores = await pdvService.getIndicadores();
      console.log('✅ Indicadores obtidos com sucesso!');
      console.log(`Total de registros: ${indicadores.length}`);
      console.table(indicadores.slice(0, 5));
      return indicadores;
    } catch (error) {
      console.error('❌ Erro ao buscar indicadores:', error);
      throw error;
    }
  },

  async testOFX() {
    console.log('📊 Testando endpoint de OFX...');
    try {
      const relatorio = await pdvService.getOFX();
      console.log('✅ OFX obtido com sucesso!');
      console.log(`Total de empresas: ${relatorio.empresas.length}`);
      console.log(`Total de registros históricos: ${relatorio.registrosPorData.length}`);
      console.log(`Percentual geral de conciliação: ${relatorio.percentualConciliacaoGeral.toFixed(2)}%`);
      console.log('Primeiras 5 empresas:');
      console.table(relatorio.empresas.slice(0, 5));
      console.log('Últimos 10 registros históricos:');
      console.table(relatorio.registrosPorData.slice(0, 10));
      return relatorio;
    } catch (error) {
      console.error('❌ Erro ao buscar OFX:', error);
      throw error;
    }
  },

  async testTudo() {
    console.log('🧪 Executando todos os testes...\n');
    try {
      console.log('--- TESTE 1: TOKEN ---');
      await this.testToken();

      console.log('\n--- TESTE 2: CAIXAS ---');
      await this.testCaixas();

      console.log('\n--- TESTE 3: INDICADORES COM EMPRESAS ---');
      await this.testIndicadores();

      console.log('\n--- TESTE 4: OFX ---');
      await this.testOFX();

      console.log('\n✅ Todos os testes completados com sucesso!');
    } catch (error) {
      console.error('❌ Testes falharam em alguma etapa');
    }
  },
};

// Adicionar ao window para fácil acesso
if (typeof window !== 'undefined') {
  (window as any).testAPI = testAPI;
}

export default testAPI;
