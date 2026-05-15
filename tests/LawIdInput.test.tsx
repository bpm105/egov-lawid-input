import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LawIdInput } from '../src/LawIdInput';

describe('LawIdInput basic render', () => {
  test('input と submit ボタンが描画される', () => {
    render(<LawIdInput />);
    expect(screen.getByPlaceholderText(/法令ID/)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('placeholder を props で上書きできる', () => {
    render(<LawIdInput placeholder="検索ワード" />);
    expect(screen.getByPlaceholderText('検索ワード')).toBeInTheDocument();
  });

  test('submitLabel を props で上書きできる', () => {
    render(<LawIdInput submitLabel="確定" />);
    expect(screen.getByRole('button')).toHaveTextContent('確定');
  });

  test('hideSubmitButton=true なら submit ボタンを描画しない', () => {
    render(<LawIdInput hideSubmitButton />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('initialValue を渡すと input の初期値になる', () => {
    render(<LawIdInput initialValue="323AC0000000124" />);
    expect(screen.getByDisplayValue('323AC0000000124')).toBeInTheDocument();
  });
});

describe('LawIdInput direct law ID submit', () => {
  test('英数のみ入力時に submit ボタンが有効化される', async () => {
    const user = userEvent.setup();
    render(<LawIdInput />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await user.type(screen.getByPlaceholderText(/法令ID/), '323AC0000000124');
    expect(button).not.toBeDisabled();
  });

  test('submit ボタン押下で onSubmit(lawId) を呼ぶ', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<LawIdInput onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '323AC0000000124');
    await user.click(screen.getByRole('button'));
    expect(onSubmit).toHaveBeenCalledWith('323AC0000000124');
  });

  test('日本語クエリのとき submit ボタンは無効', async () => {
    const user = userEvent.setup();
    render(<LawIdInput />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '民法');
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('LawIdInput keyword search', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        laws: [
          { law_info: { law_id: 'A', law_num: 'L1' }, revision_info: { law_title: '民法', repeal_status: 'None' } },
          { law_info: { law_id: 'B', law_num: 'L2' }, revision_info: { law_title: '民法施行法', repeal_status: 'None' } },
        ],
      }), { status: 200 })
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('入力後 debounceMs 経過で fetch が呼ばれ候補が表示される', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LawIdInput debounceMs={300} />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '民法');
    expect(global.fetch).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    await Promise.resolve();
    await Promise.resolve();
    expect(global.fetch).toHaveBeenCalled();
    expect(await screen.findByText('民法')).toBeInTheDocument();
    expect(screen.getByText('民法施行法')).toBeInTheDocument();
  });

  test('結果ゼロのとき noResultsText を表示', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ laws: [] }), { status: 200 })
    );
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LawIdInput debounceMs={300} noResultsText="該当なし" />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '存在しない法令');
    jest.advanceTimersByTime(300);
    expect(await screen.findByText('該当なし')).toBeInTheDocument();
  });

  test('searchLimit を反映する', async () => {
    const laws = Array.from({ length: 5 }, (_, i) => ({
      law_info: { law_id: `L${i}`, law_num: `n${i}` },
      revision_info: { law_title: `法${i}`, repeal_status: 'None' },
    }));
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ laws }), { status: 200 })
    );
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LawIdInput debounceMs={300} searchLimit={2} />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '法');
    jest.advanceTimersByTime(300);
    await screen.findByText('法0');
    expect(screen.getByText('法1')).toBeInTheDocument();
    expect(screen.queryByText('法2')).not.toBeInTheDocument();
  });

  test('英数のみ入力時はキーワード検索しない', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LawIdInput debounceMs={300} />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '323AC0000000124');
    jest.advanceTimersByTime(300);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('LawIdInput keyboard navigation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        laws: [
          { law_info: { law_id: 'A', law_num: 'L1' }, revision_info: { law_title: '民法', repeal_status: 'None' } },
          { law_info: { law_id: 'B', law_num: 'L2' }, revision_info: { law_title: '民法施行法', repeal_status: 'None' } },
        ],
      }), { status: 200 })
    );
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('↓ で次の候補をハイライトし、Enter で確定する', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onSelect = jest.fn();
    render(<LawIdInput onSelect={onSelect} debounceMs={300} />);
    const input = screen.getByPlaceholderText(/法令ID/);
    await user.type(input, '民法');
    jest.advanceTimersByTime(300);
    await screen.findByText('民法');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ lawId: 'B' }));
  });

  test('↑ で上の候補に戻る', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onSelect = jest.fn();
    render(<LawIdInput onSelect={onSelect} debounceMs={300} />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '民法');
    jest.advanceTimersByTime(300);
    await screen.findByText('民法');
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{Enter}');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ lawId: 'A' }));
  });

  test('Esc で候補が閉じる', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LawIdInput debounceMs={300} />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '民法');
    jest.advanceTimersByTime(300);
    await screen.findByText('民法');
    await user.keyboard('{Escape}');
    expect(screen.queryByText('民法')).not.toBeInTheDocument();
  });
});

describe('LawIdInput selection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        laws: [
          { law_info: { law_id: 'A', law_num: 'L1' }, revision_info: { law_title: '民法', repeal_status: 'None' } },
        ],
      }), { status: 200 })
    );
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('候補をクリックすると onSelect が呼ばれ、input が lawId で埋まる', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onSelect = jest.fn();
    render(<LawIdInput onSelect={onSelect} debounceMs={300} />);
    const input = screen.getByPlaceholderText(/法令ID/) as HTMLInputElement;
    await user.type(input, '民法');
    jest.advanceTimersByTime(300);
    const item = await screen.findByText('民法');
    await user.click(item);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ lawId: 'A', lawTitle: '民法' }));
    expect(input.value).toBe('A');
  });

  test('選択後はドロップダウンが閉じる', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LawIdInput debounceMs={300} />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '民法');
    jest.advanceTimersByTime(300);
    const item = await screen.findByText('民法');
    await user.click(item);
    expect(screen.queryByText('民法')).not.toBeInTheDocument();
  });
});

describe('LawIdInput outside click', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        laws: [
          { law_info: { law_id: 'A', law_num: 'L1' }, revision_info: { law_title: '民法', repeal_status: 'None' } },
        ],
      }), { status: 200 })
    );
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('wrapper の外側を mousedown するとドロップダウンが閉じる', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <div>
        <LawIdInput debounceMs={300} />
        <div data-testid="outside">outside</div>
      </div>
    );
    await user.type(screen.getByPlaceholderText(/法令ID/), '民法');
    jest.advanceTimersByTime(300);
    await screen.findByText('民法');
    await user.pointer({ keys: '[MouseLeft>]', target: screen.getByTestId('outside') });
    expect(screen.queryByText('民法')).not.toBeInTheDocument();
  });
});

describe('LawIdInput pristine and onReset', () => {
  test('initialValue がある状態で focus すると onReset が呼ばれ、input が空になる', async () => {
    const user = userEvent.setup();
    const onReset = jest.fn();
    render(<LawIdInput initialValue="X" onReset={onReset} />);
    const input = screen.getByDisplayValue('X');
    await user.click(input);
    expect(onReset).toHaveBeenCalled();
    expect((input as HTMLInputElement).value).toBe('');
  });

  test('一度編集した後の再 focus では onReset は再度呼ばれない', async () => {
    const user = userEvent.setup();
    const onReset = jest.fn();
    render(<LawIdInput initialValue="X" onReset={onReset} />);
    const input = screen.getByDisplayValue('X');
    await user.click(input);              // 1 回目: clear + onReset
    await user.type(input, 'Y');
    onReset.mockClear();
    await user.tab();
    await user.click(input);
    expect(onReset).not.toHaveBeenCalled();
  });

  test('initialValue の変更で input 値が同期する', () => {
    const { rerender } = render(<LawIdInput initialValue="A" />);
    expect(screen.getByDisplayValue('A')).toBeInTheDocument();
    rerender(<LawIdInput initialValue="B" />);
    expect(screen.getByDisplayValue('B')).toBeInTheDocument();
  });
});

describe('LawIdInput badges', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('isRepealed=true で「廃止」バッジが表示される（既定 ON）', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        laws: [{ law_info: { law_id: 'X', law_num: 'x' }, revision_info: { law_title: '旧法', repeal_status: 'Repeal' } }],
      }), { status: 200 })
    );
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LawIdInput debounceMs={300} />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '旧法');
    jest.advanceTimersByTime(300);
    await screen.findByText('旧法');
    expect(screen.getByText('廃止')).toBeInTheDocument();
  });

  test('showRepealedBadge=false で「廃止」バッジを描画しない', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        laws: [{ law_info: { law_id: 'X', law_num: 'x' }, revision_info: { law_title: '旧法', repeal_status: 'Repeal' } }],
      }), { status: 200 })
    );
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LawIdInput debounceMs={300} showRepealedBadge={false} />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '旧法');
    jest.advanceTimersByTime(300);
    await screen.findByText('旧法');
    expect(screen.queryByText('廃止')).not.toBeInTheDocument();
  });

  test('showRevisionBadge=false（既定）では fetchRevisionCount を呼ばない', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        laws: [{ law_info: { law_id: 'X', law_num: 'x' }, revision_info: { law_title: '法', repeal_status: 'None' } }],
      }), { status: 200 })
    );
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LawIdInput debounceMs={300} />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '法');
    jest.advanceTimersByTime(300);
    await screen.findByText('法');
    expect(fetchSpy).toHaveBeenCalledTimes(1); // searchLaws のみ
  });

  test('showRevisionBadge=true で revisionCount=1 のとき「単一施行日」バッジが付く', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        laws: [{ law_info: { law_id: 'X', law_num: 'x' }, revision_info: { law_title: '法', repeal_status: 'None' } }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ revisions: [{}] }), { status: 200 }));
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LawIdInput debounceMs={300} showRevisionBadge />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '法');
    jest.advanceTimersByTime(300);
    await screen.findByText('法');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    await screen.findByText('単一施行日');
  });
});

describe('LawIdInput onError and apiBaseUrl', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('fetch throw 時に onError が呼ばれる', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('net'));
    const onError = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LawIdInput debounceMs={300} onError={onError} />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '民法');
    jest.advanceTimersByTime(300);
    await Promise.resolve();
    await Promise.resolve();
    expect(onError).toHaveBeenCalled();
  });

  test('apiBaseUrl がリクエストに反映される', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ laws: [] }), { status: 200 })
    );
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LawIdInput debounceMs={300} apiBaseUrl="http://mock.test/api" />);
    await user.type(screen.getByPlaceholderText(/法令ID/), '民法');
    jest.advanceTimersByTime(300);
    await Promise.resolve();
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('http://mock.test/api/laws'));
  });
});

describe('LawIdInput stale response', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('遅い応答が後着しても古い結果でドロップダウンを上書きしない', async () => {
    jest.useFakeTimers();
    let resolveFirst: (v: Response) => void = () => {};
    const firstResponse = new Promise<Response>((r) => { resolveFirst = r; });
    let resolveSecond: (v: Response) => void = () => {};
    const secondResponse = new Promise<Response>((r) => { resolveSecond = r; });

    const fetchSpy = jest.spyOn(global, 'fetch')
      .mockReturnValueOnce(firstResponse as unknown as Promise<Response>)
      .mockReturnValueOnce(secondResponse as unknown as Promise<Response>);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<LawIdInput debounceMs={100} />);
    const input = screen.getByPlaceholderText(/法令ID/);

    await user.type(input, '民');
    jest.advanceTimersByTime(100);
    await user.type(input, '法');
    jest.advanceTimersByTime(100);

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    // 2 番目の応答（最新）が先に到着
    resolveSecond(new Response(JSON.stringify({
      laws: [{ law_info: { law_id: 'NEW', law_num: 'n' }, revision_info: { law_title: 'new', repeal_status: 'None' } }],
    }), { status: 200 }));
    await screen.findByText('new');

    // 1 番目の応答（古い）が後から到着
    resolveFirst(new Response(JSON.stringify({
      laws: [{ law_info: { law_id: 'OLD', law_num: 'o' }, revision_info: { law_title: 'old', repeal_status: 'None' } }],
    }), { status: 200 }));

    await Promise.resolve();
    expect(screen.queryByText('old')).not.toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });
});
