import { searchLaws, fetchRevisionCount } from '../src/api';

describe('searchLaws', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('構築する URL に law_title クエリと limit=50 を含める', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ laws: [] }), { status: 200 })
    );
    await searchLaws('民法');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://laws.e-gov.go.jp/api/2/laws?law_title=%E6%B0%91%E6%B3%95&limit=50'
    );
  });

  test('完全一致 → 前方一致 → その他の順で並び替える', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        laws: [
          { law_info: { law_id: 'B', law_num: 'b' }, revision_info: { law_title: '民法施行法', repeal_status: 'None' } },
          { law_info: { law_id: 'A', law_num: 'a' }, revision_info: { law_title: '民法', repeal_status: 'None' } },
          { law_info: { law_id: 'C', law_num: 'c' }, revision_info: { law_title: '商法（民法準用部分）', repeal_status: 'None' } },
        ],
      }), { status: 200 })
    );
    const results = await searchLaws('民法');
    expect(results.map((r) => r.lawId)).toEqual(['A', 'B', 'C']);
  });

  test('limit で先頭 N 件に切る（既定 10）', async () => {
    const laws = Array.from({ length: 15 }, (_, i) => ({
      law_info: { law_id: `L${i}`, law_num: `n${i}` },
      revision_info: { law_title: `法${i}`, repeal_status: 'None' },
    }));
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ laws }), { status: 200 })
    );
    const results = await searchLaws('法');
    expect(results).toHaveLength(10);
  });

  test('空クエリは fetch を呼ばずに [] を返す', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const results = await searchLaws('   ');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(results).toEqual([]);
  });

  test('非 2xx 応答では [] を返す', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('', { status: 500 }));
    const results = await searchLaws('民法');
    expect(results).toEqual([]);
  });

  test('fetch が throw したら [] を返し onError を呼ぶ', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
    const onError = jest.fn();
    const results = await searchLaws('民法', 10, undefined, onError);
    expect(results).toEqual([]);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  test('apiBaseUrl を差し替えできる', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ laws: [] }), { status: 200 })
    );
    await searchLaws('民法', 10, 'http://mock.test/api');
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://mock.test/api/laws?law_title=%E6%B0%91%E6%B3%95&limit=50'
    );
  });

  test('isRepealed: revision_info.repeal_status === "Repeal" のとき true', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        laws: [{
          law_info: { law_id: 'X', law_num: 'x' },
          revision_info: { law_title: 'X法', repeal_status: 'Repeal' },
        }],
      }), { status: 200 })
    );
    const results = await searchLaws('X');
    expect(results[0].isRepealed).toBe(true);
  });
});

describe('fetchRevisionCount', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('revisions 配列の長さを返す', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ revisions: [{}, {}, {}] }), { status: 200 })
    );
    const count = await fetchRevisionCount('LAW1');
    expect(count).toBe(3);
  });

  test('非 2xx で undefined を返す', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('', { status: 404 }));
    const count = await fetchRevisionCount('LAW1');
    expect(count).toBeUndefined();
  });

  test('fetch throw 時に undefined + onError', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('boom'));
    const onError = jest.fn();
    const count = await fetchRevisionCount('LAW1', undefined, onError);
    expect(count).toBeUndefined();
    expect(onError).toHaveBeenCalled();
  });

  test('apiBaseUrl を差し替えできる', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ revisions: [] }), { status: 200 })
    );
    await fetchRevisionCount('LAW1', 'http://mock.test/api');
    expect(fetchSpy).toHaveBeenCalledWith('http://mock.test/api/law_revisions/LAW1');
  });
});
