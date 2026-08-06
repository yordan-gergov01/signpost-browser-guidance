import { Button } from '@/shared/ui/Button';
import { Panel } from '@/shared/ui/Panel';
import { API_KEYS } from '@/features/settings/data/apiKeys';

export function ApiKeysPanel() {
  return (
    <Panel
      title="API keys"
      description="Keys are shown once at creation"
      actions={
        <Button variant="primary" data-testid="create-api-key">
          Create key
        </Button>
      }
    >
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-ink-500">
          <tr>
            <th scope="col" className="py-2 font-medium">
              Label
            </th>
            <th scope="col" className="py-2 font-medium">
              Key
            </th>
            <th scope="col" className="py-2 font-medium">
              Created
            </th>
            <th scope="col" className="py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200">
          {API_KEYS.map((key) => (
            <tr key={key.id}>
              <td className="py-2 font-medium text-ink-800">{key.label}</td>
              <td className="py-2 font-mono text-ink-600">{key.prefix}••••••••</td>
              <td className="py-2 text-ink-600">{key.created}</td>
              <td className="py-2 text-right">
                <Button variant="ghost" aria-label={`Revoke ${key.label} key`}>
                  Revoke
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
