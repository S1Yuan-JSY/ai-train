"""User-facing model errors without exposing credentials, request bodies or SDK logs."""
from openai import APIStatusError, APITimeoutError, APIConnectionError
from langchain_core.exceptions import OutputParserException
from pydantic import ValidationError


class ModelConfigurationError(RuntimeError):
    pass


def meal_error(exc):
    suffix = '未保存饮食记录。'
    if isinstance(exc, ModelConfigurationError):
        return 503, str(exc) + suffix
    if isinstance(exc, APIStatusError):
        messages = {
            401: 'DeepSeek 密钥无效或已失效，请更新 backend/.env 中的 DEEPSEEK_API_KEY 后重启服务。',
            402: 'DeepSeek 账户余额不足，请检查账户余额后重试。',
            404: 'DeepSeek 模型或接口地址不可用，请检查 DEEPSEEK_MODEL 和 DEEPSEEK_BASE_URL 后重启服务。',
            503: '模型服务当前繁忙，请稍后重试；也可从食物库选择或按包装标签记录。',
            429: 'DeepSeek 请求过于频繁或额度受限，请稍后重试。',
        }
        return 502, messages.get(exc.status_code, 'DeepSeek 接口暂时无法完成请求，请稍后重试或检查模型配置。') + suffix
    if isinstance(exc, (APITimeoutError, TimeoutError)):
        return 504, '模型响应超时，请稍后重试；也可从食物库选择或按包装标签记录。' + suffix
    if isinstance(exc, APIConnectionError):
        return 502, '无法连接 DeepSeek，请检查服务端网络和 DEEPSEEK_BASE_URL。' + suffix
    if isinstance(exc, (ValidationError, OutputParserException, ValueError)):
        return 502, '模型返回的饮食数据未通过校验，请说明已吃的食物、份量及做法后重试。' + suffix
    return 502, '饮食提取或估算失败，请稍后重试。' + suffix
