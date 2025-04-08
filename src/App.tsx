import React, { useState, useEffect } from 'react';
import { Send, ArrowLeft, ArrowRight } from 'lucide-react';
import InputMask from 'react-input-mask';

interface AddressData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

// Interface para o formulário
interface FormData {
  NOME: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  CPF: string;
  RG: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  valor_pagar: string;
  data: string;
  qtd_parcelas: string;
  valor_parcela: string;
  forma_pagamento: string;
  produto: string;
  vendedor: string;
  forma_cobranca: string;
}

function App() {
  // Formatando a data atual para o formato YYYY-MM-DD para o input date no fuso horário de Brasília
  const hoje = new Date();
  const dataAtual = new Date(hoje.getTime() - (hoje.getTimezoneOffset() * 60000))
    .toISOString()
    .split('T')[0];

  const [formData, setFormData] = useState<FormData>({
    NOME: '',
    email: '',
    telefone: '',
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
    valor_parcela: '',
    forma_pagamento: 'PIX',
    produto: 'CCANN',
    vendedor: 'MILENA',
    forma_cobranca: 'À VISTA'
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cep, setCep] = useState('');
  const [dateError, setDateError] = useState('');
  // Estado para controlar a etapa atual do formulário
  const [etapaAtual, setEtapaAtual] = useState(1);
  const totalEtapas = 3;

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
    // Usar o fuso horário local (Brasília) para ambas as datas
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
      // Formato DD-MM-AAAA para a data - ajustado para o fuso horário de Brasília
      const dataParts = formData.data.split('-');
      const ano = dataParts[0];
      const mes = dataParts[1];
      const dia = dataParts[2];
      const dataFormatada = `${dia}-${mes}-${ano}`;
      
      // Formato DD-MM-AAAA para a data de nascimento - ajustado para o fuso horário de Brasília
      const birthDateParts = formData.data_nascimento.split('-');
      const anoNascimento = birthDateParts[0];
      const mesNascimento = birthDateParts[1];
      const diaNascimento = birthDateParts[2];
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
      
      // Simplificar a string de valor real
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
        ano,
        forma_pagamento: formData.forma_pagamento,
        produto: formData.produto,
        vendedor: formData.vendedor,
        forma_cobranca: formData.forma_cobranca
      };

      console.log('Enviando contrato com forma de cobrança:', formData.forma_cobranca);
      
      const response = await fetch('https://hook.us1.make.com/vq7mfoc3r2g8owldmd967t64zj1slfdt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  // Função para avançar para a próxima etapa
  const avancarEtapa = () => {
    if (etapaAtual < totalEtapas) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  // Função para voltar para a etapa anterior
  const voltarEtapa = () => {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  // Validação da etapa atual antes de avançar
  const validarEtapaAtual = () => {
    if (etapaAtual === 1) {
      // Validar informações pessoais
      return !!formData.NOME && !!formData.email && !!formData.telefone && !!formData.data_nascimento && 
             !!formData.CPF && !!formData.RG && !dateError;
    } else if (etapaAtual === 2) {
      // Validar endereço
      return !!formData.endereco && !!formData.numero && !!formData.bairro && 
             !!formData.cidade && !!formData.estado;
    } else if (etapaAtual === 3) {
      // Validar informações financeiras
      return !!formData.valor_pagar && !!formData.qtd_parcelas && 
             !!formData.data && !!formData.forma_pagamento && !!formData.produto && 
             !!formData.vendedor && !!formData.forma_cobranca;
    }
    return true;
  };

  // Renderiza o indicador de progresso
  const renderIndicadorProgresso = () => {
    return (
      <div className="flex items-center justify-between w-full mb-8">
        {Array.from({ length: totalEtapas }).map((_, index) => (
          <div key={index} className="flex items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index + 1 === etapaAtual 
                  ? 'bg-green-500 text-white' 
                  : index + 1 < etapaAtual 
                    ? 'bg-green-300 text-gray-800' 
                    : 'bg-gray-600 text-white'
              }`}
            >
              {index + 1}
            </div>
            {index < totalEtapas - 1 && (
              <div 
                className={`h-1 w-24 mx-2 ${
                  index + 1 < etapaAtual ? 'bg-green-300' : 'bg-gray-600'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Renderiza a etapa de informações pessoais
  const renderEtapa1 = () => {
    return (
      <>
        <h2 className="text-xl font-semibold text-green-400 mb-6">Informações Pessoais</h2>
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
            <label className="block text-green-400 mb-2" htmlFor="telefone">Telefone</label>
            <InputMask
              mask="(99) 99999-9999"
              type="text"
              id="telefone"
              name="telefone"
              value={formData.telefone}
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
        </div>
      </>
    );
  };

  // Renderiza a etapa de endereço
  const renderEtapa2 = () => {
    return (
      <>
        <h2 className="text-xl font-semibold text-green-400 mb-6">Endereço</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      </>
    );
  };

  // Renderiza a etapa de informações financeiras
  const renderEtapa3 = () => {
    return (
      <>
        <h2 className="text-xl font-semibold text-green-400 mb-6">Informações Financeiras</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-green-400 mb-2" htmlFor="vendedor">Vendedor</label>
            <select
              id="vendedor"
              name="vendedor"
              value={formData.vendedor}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
              required
            >
              <option value="MILENA">MILENA</option>
              <option value="ALANA">ALANA</option>
              <option value="CONAES">CONAES</option>
            </select>
          </div>
          
          <div>
            <label className="block text-green-400 mb-2" htmlFor="produto">Produto</label>
            <select
              id="produto"
              name="produto"
              value={formData.produto}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
              required
            >
              <option value="Pós - CCANN">Pós - CCANN</option>
              <option value="CCANN">CCANN</option>
              <option value="PED NA PRÁTICA">PED NA PRÁTICA</option>
              <option value="CONGRESSO">CONGRESSO</option>
            </select>
          </div>

          <div>
            <label className="block text-green-400 mb-2" htmlFor="forma_cobranca">Forma de Cobrança</label>
            <select
              id="forma_cobranca"
              name="forma_cobranca"
              value={formData.forma_cobranca}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
              required
            >
              <option value="À VISTA">À VISTA</option>
              <option value="Recorrência">Recorrência</option>
              <option value="C. Crédito">C. Crédito</option>
            </select>
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
            <select
              id="qtd_parcelas"
              name="qtd_parcelas"
              value={formData.qtd_parcelas}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
              required
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'parcela' : 'parcelas'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-green-400 mb-2" htmlFor="forma_pagamento">Gateway</label>
            <select
              id="forma_pagamento"
              name="forma_pagamento"
              value={formData.forma_pagamento}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
              required
            >
              <option value="PIX">PIX</option>
              <option value="GURU">GURU</option>
              <option value="ASAAS">ASAAS</option>
            </select>
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
      </>
    );
  };

  // Renderiza os botões de navegação de acordo com a etapa atual
  const renderBotoesNavegacao = () => {
    return (
      <div className="flex justify-between mt-8">
        {etapaAtual > 1 && (
          <button
            type="button"
            onClick={voltarEtapa}
            className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Anterior
          </button>
        )}
        
        {etapaAtual < totalEtapas ? (
          <button
            type="button"
            onClick={avancarEtapa}
            disabled={!validarEtapaAtual()}
            className={`ml-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors ${!validarEtapaAtual() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Próximo
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || !!dateError}
            className={`ml-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors ${(loading || !!dateError) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        )}
      </div>
    );
  };

  // Renderiza o conteúdo da etapa atual
  const renderEtapaAtual = () => {
    switch (etapaAtual) {
      case 1:
        return renderEtapa1();
      case 2:
        return renderEtapa2();
      case 3:
        return renderEtapa3();
      default:
        return null;
    }
  };

  // Função para reiniciar o formulário e gerar um novo contrato
  const iniciarNovoContrato = () => {
    setSuccess(false);
    setFormData({
      NOME: '',
      email: '',
      telefone: '',
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
      valor_parcela: '',
      forma_pagamento: 'PIX',
      produto: 'CCANN',
      vendedor: 'MILENA',
      forma_cobranca: 'À VISTA'
    });
    setCep('');
    setEtapaAtual(1);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-green-400 mb-8 text-center">Criação de Contratos</h1>
        
        {renderIndicadorProgresso()}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderEtapaAtual()}
          {renderBotoesNavegacao()}
        </form>

        {/* Modal de sucesso */}
        {success && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 border border-green-500">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-400 mb-2">Sucesso!</h2>
                <p className="text-white text-lg mb-6">Seu contrato foi gerado com êxito.</p>
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={iniciarNovoContrato}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Gerar Novo Contrato
                  </button>
                  <button
                    onClick={() => setSuccess(false)}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;