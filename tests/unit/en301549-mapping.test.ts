import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapWcagToEN301549, mapWcagCriteriaToClauseIds, getAllClause9Mappings } from '../../src/mappings/en301549.js';

describe('EN 301 549 mapping — basics', () => {
  it('maps a WCAG 2.1 criterion to its EN 301 549 clause', () => {
    const result = mapWcagToEN301549('2.4.7');
    assert.ok(result);
    assert.equal(result.id, '9.2.4.7');
    assert.equal(result.title, 'Focus Visible');
    assert.equal(result.wcagMapping, '2.4.7');
    assert.ok(result.helpText);
  });

  it('returns undefined for unknown criteria', () => {
    assert.equal(mapWcagToEN301549('99.99.99'), undefined);
  });

  it('maps multiple WCAG criteria to clause IDs', () => {
    const ids = mapWcagCriteriaToClauseIds(['1.1.1', '2.4.7', '4.1.2']);
    assert.deepEqual(ids, ['9.1.1.1', '9.2.4.7', '9.4.1.2']);
  });

  it('skips unknown criteria in batch mapping', () => {
    const ids = mapWcagCriteriaToClauseIds(['1.1.1', '99.99.99', '4.1.2']);
    assert.deepEqual(ids, ['9.1.1.1', '9.4.1.2']);
  });
});

describe('EN 301 549 mapping — completeness', () => {
  it('every clause has id, title, wcagMapping, and helpText', () => {
    const all = getAllClause9Mappings();
    for (const [wcag, clause] of Object.entries(all)) {
      assert.ok(clause.id, `${wcag} missing id`);
      assert.ok(clause.title, `${wcag} missing title`);
      assert.equal(clause.wcagMapping, wcag, `${wcag} wcagMapping mismatch`);
      assert.ok(clause.helpText, `${wcag} missing helpText`);
    }
  });

  it('clause IDs follow the 9.X.Y.Z pattern matching WCAG X.Y.Z', () => {
    const all = getAllClause9Mappings();
    for (const [wcag, clause] of Object.entries(all)) {
      assert.equal(clause.id, `9.${wcag}`, `Clause ${clause.id} should mirror WCAG ${wcag}`);
    }
  });
});

describe('EN 301 549 mapping — WCAG 2.2 criteria', () => {
  const wcag22Criteria = ['2.4.11', '2.5.7', '2.5.8', '3.2.6', '3.3.7', '3.3.8'];

  it('includes all 6 WCAG 2.2 AA criteria', () => {
    for (const wcag of wcag22Criteria) {
      const result = mapWcagToEN301549(wcag);
      assert.ok(result, `WCAG ${wcag} should be mapped`);
    }
  });

  it('marks all WCAG 2.2 criteria with wcag22Only flag', () => {
    for (const wcag of wcag22Criteria) {
      const result = mapWcagToEN301549(wcag);
      assert.ok(result);
      assert.equal(result.wcag22Only, true, `WCAG ${wcag} should have wcag22Only=true`);
    }
  });

  it('does not mark WCAG 2.1 criteria with wcag22Only', () => {
    const wcag21Criteria = ['1.1.1', '1.4.3', '2.4.7', '3.3.1', '4.1.2'];
    for (const wcag of wcag21Criteria) {
      const result = mapWcagToEN301549(wcag);
      assert.ok(result);
      assert.ok(!result.wcag22Only, `WCAG ${wcag} should NOT have wcag22Only`);
    }
  });
});
