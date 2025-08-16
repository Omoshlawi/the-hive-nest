import * as net from 'net';

export async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.listen(0, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(port);
        }
      });
    });

    server.on('error', reject);
  });
}

// TODO: Add IP Extraction helpers
