```bash
TypeError: fetch failed
    at async register (lib\actions\auth.ts:43:21)
  41 |   }
  42 |
> 43 |   const { error } = await supabase.auth.signUp({
     |                     ^
  44 |     email,
  45 |     password,
  46 |     options: { {
  [cause]: Error [SocketError]: other side closed
      at ignore-listed frames {
    code: 'UND_ERR_SOCKET',
    socket: {
      localAddress: '127.0.0.1',
      localPort: 50288,
      remoteAddress: '127.0.0.1',
      remotePort: 54321,
      remoteFamily: 'IPv4',
      timeout: undefined,
      bytesWritten: 702,
      bytesRead: 0
    }
  }
}
```
