import { useEffect, useState } from 'react';
import { ApiError, api } from '../lib/api';
import type { StockMovement } from '../types/domain';

function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMovements = async () => {
      try {
        setLoading(true);
        setError('');
        // Get all products first, then get movements for each
        const productsResponse = await api.listProducts({ page: 1, pageSize: 100 });
        const allMovements: StockMovement[] = [];
        
        for (const product of productsResponse.data) {
          try {
            const movementsResponse = await api.getStockMovements(product.id, { page: 1, pageSize: 10 });
            allMovements.push(...movementsResponse.data.map((m: any) => ({
              ...m,
              productName: product.name,
              productSku: product.sku,
            })));
          } catch (err) {
            // Skip if no movements
          }
        }
        
        // Sort by date
        allMovements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMovements(allMovements.slice(0, 50));
      } catch (requestError) {
        setError(requestError instanceof ApiError ? requestError.message : 'Unable to load stock movements');
      } finally {
        setLoading(false);
      }
    };

    void loadMovements();
  }, []);

  return (
    <div>
      <div className="header">
        <h1>Stock Movements</h1>
      </div>

      <div className="content">
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading stock movements...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <h3>No stock movements found</h3>
                        <p>Stock movements will appear here when you adjust inventory</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  movements.map((movement) => (
                    <tr key={movement.id}>
                      <td>{new Date(movement.createdAt).toLocaleString()}</td>
                      <td>{(movement as any).productName || '-'}</td>
                      <td>{(movement as any).productSku || '-'}</td>
                      <td>
                        <span className={`badge badge-${movement.movementType === 'IN' ? 'success' : 'warning'}`}>
                          {movement.movementType}
                        </span>
                      </td>
                      <td>{movement.quantity}</td>
                      <td>{movement.reason || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockMovements;
