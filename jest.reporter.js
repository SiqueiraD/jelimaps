const fs = require('fs');
const path = require('path');

class MarkdownReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._outputFile = (options && options.outputFile) || 'TEST_REPORT.md';
  }

  onRunComplete(_contexts, results) {
    const now = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const passed = results.numPassedTests;
    const failed = results.numFailedTests;
    const pending = results.numPendingTests;
    const total = results.numTotalTests;
    const totalSuites = results.numTotalTestSuites;
    const passedSuites = results.numPassedTestSuites;
    const failedSuites = results.numFailedTestSuites;

    const totalDuration = results.testResults.reduce((acc, r) => {
      if (r.perfStats && r.perfStats.end && r.perfStats.start) {
        return acc + (r.perfStats.end - r.perfStats.start);
      }
      return acc;
    }, 0);
    const durationSec = (totalDuration / 1000).toFixed(2);

    const overallStatus = failed === 0 ? '✅ PASSOU' : '❌ FALHOU';

    const lines = [];

    lines.push(`# Relatório de Testes — JeliMaps`);
    lines.push(``);
    lines.push(`> **Gerado em:** ${now}  `);
    lines.push(`> **Status geral:** ${overallStatus}  `);
    lines.push(`> **Duração total:** ${durationSec}s`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Resumo`);
    lines.push(``);
    lines.push(`| | Suítes | Testes |`);
    lines.push(`|---|:---:|:---:|`);
    lines.push(`| ✅ Passou | ${passedSuites} | ${passed} |`);
    lines.push(`| ❌ Falhou | ${failedSuites} | ${failed} |`);
    lines.push(`| ⏭ Pulado | — | ${pending} |`);
    lines.push(`| **Total** | **${totalSuites}** | **${total}** |`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);

    for (const suite of results.testResults) {
      const relativePath = path.relative(process.cwd(), suite.testFilePath).replace(/\\/g, '/');
      const suiteOk = suite.numFailingTests === 0;
      const suiteIcon = suiteOk ? '✅' : '❌';
      const suiteDurationMs = suite.perfStats
        ? suite.perfStats.end - suite.perfStats.start
        : 0;
      const suiteDurationSec = (suiteDurationMs / 1000).toFixed(2);

      lines.push(`## ${suiteIcon} \`${relativePath}\``);
      lines.push(``);
      lines.push(`> Duração: **${suiteDurationSec}s** | Passou: **${suite.numPassingTests}** | Falhou: **${suite.numFailingTests}** | Pulado: **${suite.numPendingTests}**`);
      lines.push(``);

      if (suite.testResults.length === 0) {
        lines.push(`_Nenhum teste encontrado nesta suíte._`);
        lines.push(``);
        lines.push(`---`);
        lines.push(``);
        continue;
      }

      lines.push(`| # | Grupo (describe) | Teste | Status | Duração |`);
      lines.push(`|---|---|---|:---:|:---:|`);

      let i = 1;
      for (const test of suite.testResults) {
        const icon =
          test.status === 'passed' ? '✅' :
          test.status === 'failed' ? '❌' : '⏭';
        const duration = typeof test.duration === 'number' ? `${test.duration}ms` : '—';
        const describe = test.ancestorTitles.length
          ? test.ancestorTitles.join(' › ')
          : '—';
        const title = test.title.replace(/\|/g, '\\|');
        lines.push(`| ${i++} | ${describe} | ${title} | ${icon} | ${duration} |`);
      }

      const failures = suite.testResults.filter(t => t.status === 'failed');
      if (failures.length > 0) {
        lines.push(``);
        lines.push(`### ❌ Detalhes das falhas`);
        lines.push(``);
        for (const test of failures) {
          lines.push(`**${test.fullName}**`);
          lines.push(``);
          for (const msg of test.failureMessages) {
            lines.push('```');
            // eslint-disable-next-line no-control-regex
            lines.push(msg.replace(/\x1b\[[0-9;]*m/g, ''));
            lines.push('```');
          }
          lines.push(``);
        }
      }

      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    }

    fs.writeFileSync(this._outputFile, lines.join('\n'), 'utf-8');
    console.log(`\n📄 Relatório gerado: ${this._outputFile}`);
  }
}

module.exports = MarkdownReporter;
