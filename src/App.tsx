import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import InputMask from 'react-input-mask';

interface AddressData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

function App() {
  // Formatando a data atual para o formato YYYY-MM-DD para o input date
  const dataAtual = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    NOME: '',
    email: '',
    data_nascimento: '',
    CPF: '',
    RG: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    valor_pagar: '',
    data: dataAtual,
    qtd_parcelas: '1',
    valor_parcela: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cep, setCep] = useState('');
  const [dateError, setDateError] = useState('');

  // Função para converter número para texto por extenso
  const numeroParaExtenso = (numero: number): string => {
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const dezenas = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const dezenasEspeciais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    // Função auxiliar para converter números até 999
    const converterAte999 = (n: number): string => {
      if (n === 0) return '';
      if (n === 100) return 'cem';
      
      const centena = Math.floor(n / 100);
      const resto = n % 100;
      
      if (resto === 0) return centenas[centena];
      
      const dezena = Math.floor(resto / 10);
      const unidade = resto % 10;
      
      let resultado = '';
      
      if (centena > 0) {
        resultado += centenas[centena] + ' e ';
      }
      
      if (dezena === 1) {
        resultado += dezenasEspeciais[unidade];
      } else {
        if (dezena > 0) {
          resultado += dezenas[dezena];
          if (unidade > 0) {
            resultado += ' e ' + unidades[unidade];
          }
        } else if (unidade > 0) {
          resultado += unidades[unidade];
        }
      }
      
      return resultado;
    };

    if (numero === 0) return 'zero';
    
    const inteiro = Math.floor(numero);
    const decimal = Math.round((numero - inteiro) * 100);
    
    let resultado = '';
    
    // Processar parte inteira
    if (inteiro === 1) {
      resultado = 'um';
    } else if (inteiro > 0) {
      if (inteiro < 1000) {
        resultado = converterAte999(inteiro);
      } else {
        const milhar = Math.floor(inteiro / 1000);
        const resto = inteiro % 1000;
        
        if (milhar === 1) {
          resultado = 'mil';
        } else {
          resultado = converterAte999(milhar) + ' mil';
        }
        
        if (resto > 0) {
          if (resto < 100) {
            resultado += ' e ' + converterAte999(resto);
          } else {
            resultado += ' ' + converterAte999(resto);
          }
        }
      }
    }
    
    // Adicionar parte decimal
    if (decimal > 0) {
      if (inteiro > 0) {
        resultado += ' reais e ';
      }
      
      if (decimal === 1) {
        resultado += 'um centavo';
      } else if (decimal < 10) {
        resultado += unidades[decimal] + ' centavos';
      } else if (decimal < 20) {
        resultado += dezenasEspeciais[decimal - 10] + ' centavos';
      } else {
        const dezena = Math.floor(decimal / 10);
        const unidade = decimal % 10;
        
        if (unidade === 0) {
          resultado += dezenas[dezena] + ' centavos';
        } else {
          resultado += dezenas[dezena] + ' e ' + unidades[unidade] + ' centavos';
        }
      }
    } else if (inteiro > 0) {
      resultado += ' reais';
    }
    
    return resultado;
  };

  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    let numericValue = value.replace(/\D/g, '');
    
    // Se não tiver valor, retorna vazio
    if (!numericValue) return '';

    // Converte para número e divide por 100 para ter os centavos
    const floatValue = parseInt(numericValue) / 100;

    // Formata para moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(floatValue);
  };

  // Atualiza o valor da parcela quando o valor total ou número de parcelas muda
  useEffect(() => {
    if (formData.valor_pagar && formData.qtd_parcelas) {
      const valorTotal = parseInt(formData.valor_pagar) / 100;
      const parcelas = parseInt(formData.qtd_parcelas);
      
      if (parcelas > 0) {
        const valorParcela = Math.round((valorTotal / parcelas) * 100).toString();
        setFormData(prev => ({
          ...prev,
          valor_parcela: valorParcela
        }));
      }
    }
  }, [formData.valor_pagar, formData.qtd_parcelas]);

  const checkAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const birthDate = e.target.value;
    const age = checkAge(birthDate);

    if (age < 18) {
      setDateError('Você deve ter pelo menos 18 anos');
    } else {
      setDateError('');
    }

    handleChange(e);
  };

  const fetchAddress = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data: AddressData = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (dateError) {
      alert('Por favor, corrija os erros antes de enviar.');
      return;
    }

    setLoading(true);

    try {
      // Formato DD-MM-AAAA para a data - corrigindo o problema do dia a menos
      const dateParts = formData.data.split('-');
      const dia = dateParts[2];
      const mes = dateParts[1];
      const ano = dateParts[0];
      const dataFormatada = `${dia}-${mes}-${ano}`;
      
      // Formato DD-MM-AAAA para a data de nascimento - corrigindo o problema do dia a menos
      const birthDateParts = formData.data_nascimento.split('-');
      const diaNascimento = birthDateParts[2];
      const mesNascimento = birthDateParts[1];
      const anoNascimento = birthDateParts[0];
      const dataNascimentoFormatada = `${diaNascimento}-${mesNascimento}-${anoNascimento}`;

      const enderecoCompleto = `${formData.endereco}, ${formData.numero}, ${formData.bairro}, ${formData.cidade}-${formData.estado}`;

      // Formatação do valor para o padrão solicitado
      const valorNumerico = parseInt(formData.valor_pagar) / 100;
      const valorPorExtenso = numeroParaExtenso(valorNumerico);
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valorNumerico);
      
      // Valor formatado como "R$ X.XXX,XX (valor por extenso)"
      const valorCompleto = `R$ ${valorFormatado} (${valorPorExtenso})`;
      
      // Valor da parcela formatado
      const valorParcelaNumerico = parseInt(formData.valor_parcela) / 100;
      const valorParcelaFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valorParcelaNumerico);
      
      // Valor real no formato solicitado
      const valorParcelaSimples = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valorParcelaNumerico);
      
      const valorReal = `o valor total de R$ ${valorFormatado} (${valorPorExtenso}) em ${formData.qtd_parcelas} x de ${valorParcelaSimples}`;

      const payload = {
        ...formData,
        data: dataFormatada,
        data_nascimento: dataNascimentoFormatada,
        endereco: enderecoCompleto,
        valor_formatado: valorCompleto,
        valor_real: valorReal,
        valor_parcela_formatado: valorParcelaFormatado,
        parcelas: formData.qtd_parcelas,
        dia,
        mes,
        ano
      };

      const response = await fetch('https://hook.us1.make.com/vq7mfoc3r2g8owldmd967t64zj1slfdt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        setFormData({
          NOME: '',
          email: '',
          data_nascimento: '',
          CPF: '',
          RG: '',
          endereco: '',
          numero: '',
          bairro: '',
          cidade: '',
          estado: '',
          valor_pagar: '',
          data: '',
          qtd_parcelas: '1',
          valor_parcela: ''
        });
        setCep('');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'valor_pagar') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-green-400 mb-2 text-center">Sistema de Contratos</h1>
        <h2 className="text-xl font-bold text-white mb-8 text-center">CONAES Brasil</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-green-400 mb-2" htmlFor="NOME">Nome</label>
              <input
                type="text"
                id="NOME"
                name="NOME"
                value={formData.NOME}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="email">E-mail</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="data_nascimento">
                Data de Nascimento
                {dateError && <span className="text-red-500 text-sm ml-2">({dateError})</span>}
              </label>
              <input
                type="date"
                id="data_nascimento"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleDateChange}
                className={`w-full bg-gray-700 border ${dateError ? 'border-red-500' : 'border-gray-600'} text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500`}
                required
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="CPF">CPF</label>
              <InputMask
                mask="999.999.999-99"
                type="text"
                id="CPF"
                name="CPF"
                value={formData.CPF}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="RG">RG</label>
              <InputMask
                mask="99.999.999-9"
                type="text"
                id="RG"
                name="RG"
                value={formData.RG}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="cep">CEP</label>
              <InputMask
                mask="99999-999"
                type="text"
                id="cep"
                value={cep}
                onChange={(e) => {
                  setCep(e.target.value);
                  fetchAddress(e.target.value);
                }}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="endereco">Rua</label>
              <input
                type="text"
                id="endereco"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="numero">Número</label>
              <input
                type="text"
                id="numero"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="bairro">Bairro</label>
              <input
                type="text"
                id="bairro"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="cidade">Cidade</label>
              <input
                type="text"
                id="cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="estado">Estado</label>
              <input
                type="text"
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                required
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="valor_pagar">Valor Total</label>
              <input
                type="text"
                id="valor_pagar"
                name="valor_pagar"
                value={formData.valor_pagar ? formatCurrency(formData.valor_pagar) : ''}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="qtd_parcelas">Quantidade de Parcelas</label>
              <input
                type="number"
                id="qtd_parcelas"
                name="qtd_parcelas"
                value={formData.qtd_parcelas}
                onChange={handleChange}
                min="1"
                max="12"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="valor_parcela">Valor da Parcela</label>
              <input
                type="text"
                id="valor_parcela"
                name="valor_parcela"
                value={formData.valor_parcela ? formatCurrency(formData.valor_parcela) : ''}
                readOnly
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className="block text-green-400 mb-2" htmlFor="data">Data</label>
              <input
                type="date"
                id="data"
                name="data"
                value={formData.data}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!dateError}
            className={`w-full mt-8 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors ${(loading || !!dateError) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              'Enviando...'
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar Dados
              </>
            )}
          </button>

          {success && (
            <div className="mt-4 p-4 bg-green-500 text-white rounded-lg text-center">
              Dados enviados com sucesso!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default App;