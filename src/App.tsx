import { useState, useEffect, useRef } from 'react'
import './App.css'

type KeyPress = {
  key: string,
  downAt: number,
  upAt?: number
}

type KeyPressHistoricalRecord = {
  startKey: string,
  endKey: string,
  overlap?: number,
  delay?: number
}

function App() {
  const counterstrafeHistory = useRef<Array<KeyPressHistoricalRecord>>([]);
  const activeKeys = useRef<Record<string, KeyPress>>({});
  const oppositeKeys = useRef<Record<string, string>>({
    'a': 'd',
    'd': 'a'
  });

  const [pressedKey, setPressedKey] = useState("A");
  const [overlap, setOverlap] = useState(0);
  const [delay, setDelay] = useState(0);

  function recordCounterstrafe(startKey: string, endKey: string, overlap?: number, delay?: number) {
    const record: KeyPressHistoricalRecord = {
      startKey,
      endKey,
      overlap,
      delay
    }
    counterstrafeHistory.current.unshift(record);
    // Limit history to last 10 records
    if (counterstrafeHistory.current.length > 10) {
      counterstrafeHistory.current.pop();
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.repeat) return // ignore auto-repeat
    // Reset on Tab or Space
    if (e.key === 'Tab' || e.key === ' ') {
      e.preventDefault();

      activeKeys.current = {};
      setOverlap(0);

      return;
    }
    if (e.key.length > 1) return // ignore non-character keys
    if (e.key.toLowerCase() !== 'a' && e.key.toLowerCase() !== 'd') return // only track 'a' and 'd'

    // Either a new key press, or pressing the opposite key
    if (!activeKeys.current[e.key]) {
      const oppositeKey = oppositeKeys.current[e.key];
      const oppositeKeyPress = activeKeys.current[oppositeKey];

      // Case: Opposite key is/has already been pressed
      if (oppositeKeyPress) {
        if (oppositeKeyPress.upAt) {
          // Opposite key was released -> calculate delay
          const delayCalc = performance.now() - oppositeKeyPress.upAt;
          setDelay(delayCalc);
          recordCounterstrafe(oppositeKeyPress.key, e.key, undefined, delayCalc);

          // Clean up
          delete activeKeys.current[oppositeKey];
          delete activeKeys.current[e.key];
          setPressedKey(e.key);
          setOverlap(0);
          return;
        }
      }
    }

    // Only track if not already pressed
    if (!activeKeys.current[e.key] || activeKeys.current[e.key].upAt) {
      activeKeys.current[e.key] = {
        key: e.key,
        downAt: performance.now()
      }
      setPressedKey(e.key);
    }
  };

  function handleKeyUp(e: KeyboardEvent) {
    const keyUp = activeKeys.current[e.key]
    if (!keyUp) return // key was not tracked

    const upAt = performance.now();

    const oppositeKey = oppositeKeys.current[e.key];
    const oppositeKeyPress = activeKeys.current[oppositeKey];
    if (!oppositeKeyPress) {
      keyUp.upAt = upAt;
      return; // opposite key is not pressed
    } else {
      // Opposite key is/was pressed (overlapping case)
      console.log("Overlap occurred...");

      const overlap = performance.now() - oppositeKeyPress.downAt;
      setOverlap(overlap);
      recordCounterstrafe(e.key, oppositeKeyPress.key, overlap, undefined);

      // Clean up
      delete activeKeys.current[oppositeKey];
      delete activeKeys.current[e.key];
      setDelay(0);
      return;
    }

    // Clean up
    // delete activeKeys.current[e.key]
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Optional: reset on blur to prevent stuck keys
    window.addEventListener("blur", () => {
      for (const key in activeKeys.current) {
        delete activeKeys.current[key]
      }
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    }
  }, [])

  return (
    <div className="app-container">
      <h1>Counterstrafe Tool</h1>
      <h2>
        Press <i>A</i> or <i>D</i> to start
      </h2>
      <div className="key-display">
        {pressedKey.toUpperCase()}
      </div>

      <div className="overlap-delay-display">
        {delay !== 0 ? (
          <div>
            <b>Delay:</b>
            <br />
            {delay} ms
          </div>
        ) : (
          <div className="overlap-delay-display">
            <b>Overlap:</b>
            <br />
            {overlap} ms
          </div>
        )}
      </div>

      <div className="history-display">
        <table className="history-table">
          <thead className="history-table-head">
            <tr>
              <th>Key Presses</th>
              <th>Overlap/Delay</th>
            </tr>
          </thead>
          <tbody>

            {counterstrafeHistory.current.length === 0 ? (
              <tr className="history-table-row">
                <td colSpan={2}>N/A</td>
              </tr>
            ) : null}

            {counterstrafeHistory.current.map((record, index) => (
              <tr key={index} className={`history-table-row ${record.overlap !== undefined ? 'overlap-row' : 'delay-row'}`}>
                <td>{record.startKey.toUpperCase()} → {record.endKey.toUpperCase()}</td>
                <td>
                  {record.overlap !== undefined ? (
                    <>Overlap: {record.overlap} ms</>
                  ) : (
                    <>Delay: {record.delay} ms</>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
