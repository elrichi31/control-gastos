// Bounded component-handler harness: remote state is supplied explicitly. Real
// TanStack observers/invalidation are exercised in the cache tests separately.
const Module = require('node:module')
const load = Module._load
const fixtures = new Map()
const catalog = { categories: [{ id: 1, nombre: 'Comida' }], paymentMethods: [{ id: 1, nombre: 'Efectivo' }, { id: 2, nombre: 'Crédito' }] }
function result(data, queryFn) {
  return { data, error: null, isPending: data === undefined, isFetching: false,
    refetch: async () => ({ data: queryFn ? await queryFn(new AbortController().signal) : data }) }
}
Module._load = function(name, ...args) {
  if (name === '@/hooks/useExpenseQueries') return { useExpenseCatalogs: () => result(fixtures.get('catalogs')?.() ?? catalog) }
  if (name === '@/hooks/useRemoteData') return {
    useCachedRead: () => (_key, read) => read(),
    useRemoteQuery: (key, queryFn) => {
      const fixture = fixtures.get(key.join(':')) ?? fixtures.get(key.slice(0,2).join(':'))
      return result(fixture?.(), queryFn)
    },
    useRemoteMutation: fn => ({ mutateAsync: variables => fn(variables), isPending: false }),
  }
  return load.call(this, name, ...args)
}
module.exports = { fixtures }
