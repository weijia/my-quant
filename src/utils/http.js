/**
 * 统一的 HTTP 请求封装。
 * 整个项目所有 fetch 调用都应通过本模块的 request 函数发起，
 * 以便集中处理日志、鉴权、错误处理等公共逻辑。
 *
 * @param {string} url - 请求地址
 * @param {RequestInit} [options] - 与标准 fetch 一致的配置项
 * @returns {Promise<Response>} 原生 fetch 的 Response 对象
 */
export async function request(url, options = {}) {
  const fetchImpl = (typeof window !== 'undefined' && window.fetch) ? window.fetch : fetch
  return fetchImpl(url, options)
}

export default request
