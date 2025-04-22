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
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  valor_pagar: string;
  tem_entrada: boolean;
  valor_entrada: string;
  forma_pagamento_entrada: string;
  data: string;
  qtd_parcelas: number;
  valor_parcela: string;
  forma_pagamento: string;
  produto: string;
  vendedor: string;
  forma_cobranca: string;
  dia_vencimento: string;
  gateway: string;
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
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    valor_pagar: '',
    tem_entrada: false,
    valor_entrada: '0',
    forma_pagamento_entrada: 'PIX',
    data: dataAtual,
    qtd_parcelas: 1,
    valor_parcela: '',
    forma_pagamento: 'PIX',
    produto: 'Ccann',
    vendedor: 'Milena',
    forma_cobranca: 'Parcelamento',
    dia_vencimento: '20',
    gateway: 'PIX'
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

  // Atualiza o valor da parcela quando o valor total ou número de parcelas ou valor de entrada muda
  useEffect(() => {
    if (formData.valor_pagar && formData.qtd_parcelas) {
      const valorTotal = parseInt(formData.valor_pagar) / 100;
      let valorAParcelar = valorTotal;
      
      // Subtrair o valor da entrada se o campo tem_entrada estiver ativado
      if (formData.tem_entrada && formData.valor_entrada) {
        const valorEntrada = parseInt(formData.valor_entrada) / 100;
        valorAParcelar = valorTotal - valorEntrada;
      }
      
      const parcelas = formData.qtd_parcelas;
      
      if (parcelas > 0 && valorAParcelar > 0) {
        const valorParcela = Math.round((valorAParcelar / parcelas) * 100).toString();
        setFormData(prev => ({
          ...prev,
          valor_parcela: valorParcela
        }));
      }
    }
  }, [formData.valor_pagar, formData.qtd_parcelas, formData.valor_entrada, formData.tem_entrada]);

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

  // Função para converter número do mês em nome por extenso
  const getMesPorExtenso = (mes: string): string => {
    const meses = {
      '01': 'Janeiro',
      '02': 'Fevereiro',
      '03': 'Março',
      '04': 'Abril',
      '05': 'Maio',
      '06': 'Junho',
      '07': 'Julho',
      '08': 'Agosto',
      '09': 'Setembro',
      '10': 'Outubro',
      '11': 'Novembro',
      '12': 'Dezembro'
    };
    return meses[mes] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de idade
    if (dateError) {
      alert('Por favor, corrija os erros de idade antes de enviar.');
      return;
    }

    // Validação completa de todos os campos antes de enviar
    // Dados pessoais
    if (!formData.NOME || !formData.email || !formData.telefone || !formData.data_nascimento || !formData.CPF || !formData.RG) {
      alert('Por favor, preencha todos os dados pessoais.');
      setEtapaAtual(1);
      return;
    }

    // Dados de endereço
    if (!formData.endereco || !formData.numero || !formData.bairro || !formData.cidade || !formData.estado) {
      alert('Por favor, preencha todos os dados de endereço.');
      setEtapaAtual(2);
      return;
    }

    // Dados financeiros - validação básica para todas as formas de cobrança
    if (!formData.valor_pagar || !formData.data || !formData.forma_cobranca || !formData.produto || !formData.vendedor) {
      alert('Por favor, preencha todas as informações financeiras básicas.');
      setEtapaAtual(3);
      return;
    }

    // Validações específicas por forma de cobrança
    if (formData.tem_entrada) {
      if (!formData.valor_entrada || !formData.forma_pagamento_entrada) {
        alert('Por favor, preencha todos os dados da entrada.');
        setEtapaAtual(3);
        return;
      }
    }
    
    if (formData.forma_cobranca === 'Recorrência' || formData.forma_cobranca === 'C. Crédito') {
      if (!formData.qtd_parcelas) {
        alert('Por favor, selecione a quantidade de parcelas.');
        setEtapaAtual(3);
        return;
      }
      
      if (formData.forma_cobranca === 'Recorrência') {
        if (!formData.forma_pagamento) {
          alert('Por favor, selecione a forma de pagamento.');
          setEtapaAtual(3);
          return;
        }
        
        // Verifica se precisa validar dia de vencimento para boleto
        if (formData.forma_pagamento === 'Boleto' && !formData.dia_vencimento) {
          alert('Por favor, informe o dia de vencimento do boleto.');
          setEtapaAtual(3);
          return;
        }
      }
    } else if (formData.forma_cobranca === 'À Vista') {
      if (!formData.forma_pagamento) {
        alert('Por favor, selecione a forma de pagamento.');
        setEtapaAtual(3);
        return;
      }
      
      if (formData.forma_pagamento === 'Boleto' && !formData.dia_vencimento) {
        alert('Por favor, informe o dia de vencimento do boleto.');
        setEtapaAtual(3);
        return;
      }
    }

    setLoading(true);

    try {
      // Formato DD-MM-AAAA para a data - ajustado para o fuso horário de Brasília
      const dataParts = formData.data.split('-');
      const ano = dataParts[0];
      const mes = dataParts[1];
      const dia = dataParts[2];
      const dataFormatada = `${dia}-${mes}-${ano}`;
      const mesPorExtenso = getMesPorExtenso(mes);
      
      // Formato DD-MM-AAAA para a data de nascimento - ajustado para o fuso horário de Brasília
      const birthDateParts = formData.data_nascimento.split('-');
      const anoNascimento = birthDateParts[0];
      const mesNascimento = birthDateParts[1];
      const diaNascimento = birthDateParts[2];
      const dataNascimentoFormatada = `${diaNascimento}-${mesNascimento}-${anoNascimento}`;
      const mesNascimentoPorExtenso = getMesPorExtenso(mesNascimento);

      const enderecoCompleto = `${formData.endereco}, ${formData.numero}${formData.complemento ? `, ${formData.complemento}` : ''}, ${formData.bairro}, ${formData.cidade}-${formData.estado}`;
      
      console.log('Endereço Completo:', enderecoCompleto);
      console.log('Dados do endereço:', {
        rua: formData.endereco,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado
      });

      // Formatação do valor para o padrão solicitado
      const valorNumerico = parseInt(formData.valor_pagar) / 100;
      const valorPorExtenso = numeroParaExtenso(valorNumerico);
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valorNumerico);
      
      // Formato adicional: valor numérico sem o símbolo da moeda (ex: 7.800,12)
      const valorNumericoSemSimbolo = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
      }).format(valorNumerico);
      
      // Valor formatado como "R$ X.XXX,XX (valor por extenso)"
      const valorCompleto = `R$ ${valorFormatado} (${valorPorExtenso})`;
      
      // Formatação do valor de entrada
      const valorEntradaNumerico = parseInt(formData.valor_entrada || '0') / 100;
      const valorEntradaFormatado = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valorEntradaNumerico);
      
      // Valor da parcela formatado
      const valorParcelaNumerico = parseInt(formData.valor_parcela) / 100;
      const valorParcelaFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valorParcelaNumerico);
      
      // Formatação do valor da parcela para texto simples
      const valorParcelaSimples = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valorParcelaNumerico);
      
      // Descrição completa do pagamento
      let valorReal = '';
      
      if (formData.tem_entrada) {
        // Se tem entrada, formato será diferente independente da forma de cobrança
        let descricaoPagamento = '';
        if (formData.forma_cobranca === 'À Vista') {
          valorReal = `o valor total de R$ ${valorFormatado} (${valorPorExtenso}) sendo pago da seguinte maneira: R$ ${valorEntradaFormatado} de entrada via ${formData.forma_pagamento_entrada} e o restante via ${formData.forma_pagamento}.`;
        } else {
          // Para opções parceladas (Recorrência ou C. Crédito)
          if (formData.forma_cobranca === 'Recorrência' && formData.forma_pagamento === 'Boleto') {
            descricaoPagamento = `através de ${formData.forma_pagamento} com o vencimento determinado em todo dia ${formData.dia_vencimento} de cada mês`;
          } else if (formData.forma_cobranca === 'Recorrência') {
            descricaoPagamento = `através de ${formData.forma_pagamento}`;
          } else if (formData.forma_cobranca === 'C. Crédito') {
            descricaoPagamento = `através de cartão de crédito`;
          }
          
          valorReal = `o valor total de R$ ${valorFormatado} (${valorPorExtenso}) sendo pago da seguinte maneira: R$ ${valorEntradaFormatado} de entrada via ${formData.forma_pagamento_entrada} e demais parcelas em ${formData.qtd_parcelas} x R$ ${valorParcelaSimples} ${descricaoPagamento}.`;
        }
      } else {
        // Sem entrada
        if (formData.forma_cobranca === 'À Vista') {
          valorReal = `o valor total de R$ ${valorFormatado} (${valorPorExtenso}) através de ${formData.forma_pagamento}.`;
        } else {
          // Para opções parceladas (Recorrência ou C. Crédito)
          let descricaoPagamento = '';
          if (formData.forma_cobranca === 'Recorrência' && formData.forma_pagamento === 'Boleto') {
            descricaoPagamento = `através de ${formData.forma_pagamento} com o vencimento determinado em todo dia ${formData.dia_vencimento} de cada mês`;
          } else if (formData.forma_cobranca === 'Recorrência') {
            descricaoPagamento = `através de ${formData.forma_pagamento}`;
          } else if (formData.forma_cobranca === 'C. Crédito') {
            descricaoPagamento = `através de cartão de crédito`;
          }
          
          valorReal = `o valor total de R$ ${valorFormatado} (${valorPorExtenso}) em ${formData.qtd_parcelas} x de R$ ${valorParcelaSimples} ${descricaoPagamento}.`;
        }
      }

      // Criação da descrição padronizada para contratos
      let descricaoContratoPagamento = '';
      
      // Formatar o valor em extenso com primeira letra maiúscula
      const valorPorExtensoCapitalizado = valorPorExtenso.charAt(0).toUpperCase() + valorPorExtenso.slice(1);
      
      if (formData.tem_entrada) {
        // Se tem entrada, formato será diferente independente da forma de cobrança
        let descricaoParcelas = '';
        if (formData.forma_cobranca === 'À Vista') {
          descricaoContratoPagamento = `R$ ${valorFormatado} (${valorPorExtensoCapitalizado}) sendo pago da seguinte maneira: R$ ${valorEntradaFormatado} de entrada via ${formData.forma_pagamento_entrada} e o restante via ${formData.forma_pagamento}.`;
        } else {
          // Para opções parceladas (Recorrência ou C. Crédito)
          if (formData.forma_cobranca === 'Recorrência' && formData.forma_pagamento === 'Boleto') {
            descricaoParcelas = `via ${formData.forma_pagamento} com vencimento no dia ${formData.dia_vencimento} de cada mês`;
          } else if (formData.forma_cobranca === 'Recorrência') {
            descricaoParcelas = `via ${formData.forma_pagamento}`;
          } else if (formData.forma_cobranca === 'C. Crédito') {
            descricaoParcelas = `via cartão de crédito`;
          }
          
          descricaoContratoPagamento = `R$ ${valorFormatado} (${valorPorExtensoCapitalizado}) sendo pago da seguinte maneira: R$ ${valorEntradaFormatado} de entrada via ${formData.forma_pagamento_entrada} e o restante em ${formData.qtd_parcelas} parcelas de R$ ${valorParcelaSimples} ${descricaoParcelas}.`;
        }
      } else {
        // Sem entrada
        if (formData.forma_cobranca === 'À Vista') {
          descricaoContratoPagamento = `R$ ${valorFormatado} (${valorPorExtensoCapitalizado}) pago à vista via ${formData.forma_pagamento}.`;
        } else {
          // Para opções parceladas (Recorrência ou C. Crédito)
          let descricaoParcelas = '';
          if (formData.forma_cobranca === 'Recorrência' && formData.forma_pagamento === 'Boleto') {
            descricaoParcelas = `via ${formData.forma_pagamento} com vencimento no dia ${formData.dia_vencimento} de cada mês`;
          } else if (formData.forma_cobranca === 'Recorrência') {
            descricaoParcelas = `via ${formData.forma_pagamento}`;
          } else if (formData.forma_cobranca === 'C. Crédito') {
            descricaoParcelas = `via cartão de crédito`;
          }
          
          descricaoContratoPagamento = `R$ ${valorFormatado} (${valorPorExtensoCapitalizado}) dividido em ${formData.qtd_parcelas} parcelas de R$ ${valorParcelaSimples} ${descricaoParcelas}.`;
        }
      }

      const payload = {
        ...formData,
        data: dataFormatada,
        data_nascimento: dataNascimentoFormatada,
        endereco: enderecoCompleto,
        valor_formatado: valorCompleto,
        valor_numerico: valorNumericoSemSimbolo,
        valor_real: valorReal,
        valor_parcela_formatado: valorParcelaFormatado,
        valor_entrada_formatado: `R$ ${valorEntradaFormatado}`,
        parcelas: formData.qtd_parcelas,
        dia,
        mes,
        mes_extenso: mesPorExtenso,
        mes_nascimento_extenso: mesNascimentoPorExtenso,
        ano,
        forma_pagamento: formData.forma_pagamento,
        produto: formData.produto,
        vendedor: formData.vendedor,
        forma_cobranca: formData.forma_cobranca,
        // Nova saída padronizada para contratos
        descricao_contrato: descricaoContratoPagamento
      };

      console.log('Payload completo:', payload);
      
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'valor_pagar' || name === 'valor_entrada') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else if (name === 'qtd_parcelas') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value)
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

  // Função para validar se todos os campos obrigatórios da etapa atual estão preenchidos
  const validarEtapaAtual = () => {
    // Função comentada para permitir navegação sem validação
    /*
    if (etapaAtual === 1) {
      // Validar informações pessoais
      return !!formData.NOME && !!formData.email && !!formData.telefone && !!formData.data_nascimento && 
             !!formData.CPF && !!formData.RG && !dateError;
    } else if (etapaAtual === 2) {
      // Validar endereço (complemento não é obrigatório)
      return !!formData.endereco && !!formData.numero && !!formData.bairro && 
             !!formData.cidade && !!formData.estado;
    } else if (etapaAtual === 3) {
      // Validação básica para todas as formas de cobrança
      const validacaoBasica = !!formData.valor_pagar && !!formData.data && 
                              !!formData.forma_cobranca && !!formData.produto && 
                              !!formData.vendedor;
      
      // Validações específicas por forma de cobrança
      if (formData.forma_cobranca === 'À Vista') {
        return validacaoBasica && !!formData.forma_pagamento;
      } else if (formData.forma_cobranca === 'Entrada + Parcelamento') {
        const validacaoParcelamento = validacaoBasica && 
                                 !!formData.qtd_parcelas && 
                                 !!formData.forma_pagamento &&
                                 !!formData.valor_entrada &&
                                 !!formData.forma_pagamento_entrada;
        
        // Verifica se precisa validar dia de vencimento para boleto
        if (formData.forma_pagamento === 'Boleto') {
          return validacaoParcelamento && !!formData.dia_vencimento;
        }
        
        return validacaoParcelamento;
      } else if (formData.forma_cobranca === 'Parcelamento' || formData.forma_cobranca === 'Recorrência') {
        const validacaoParcelamento = validacaoBasica && 
                                 !!formData.qtd_parcelas && 
                                 !!formData.forma_pagamento;
        
        // Verifica se precisa validar dia de vencimento para boleto
        if (formData.forma_pagamento === 'Boleto') {
          return validacaoParcelamento && !!formData.dia_vencimento;
        }
        
        return validacaoParcelamento;
      }
      
      return validacaoBasica;
    }
    */
    
    // Sempre retorna true para permitir navegação entre etapas
    return true;
  };

  // Renderiza o indicador de progresso
  const renderIndicadorProgresso = () => {
    return (
      <div className="w-full mb-10 relative">
        {/* Barra de progresso de fundo */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 -translate-y-1/2"></div>
        
        {/* Barra de progresso preenchida */}
        <div 
          className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 transition-all duration-300"
          style={{ width: `${((etapaAtual - 1) / (totalEtapas - 1)) * 100}%` }}
        ></div>
        
        {/* Círculos de etapa */}
        <div className="flex justify-between relative">
          {Array.from({ length: totalEtapas }).map((_, index) => {
            const isCompleted = index + 1 < etapaAtual;
            const isCurrent = index + 1 === etapaAtual;
            const isPending = index + 1 > etapaAtual;
            
            return (
              <div key={index} className="flex flex-col items-center relative z-10">
                {/* Círculo da etapa */}
                <div 
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 
                    transition-all duration-300 text-sm font-bold shadow-lg
                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                    ${isCurrent ? 'bg-green-500 border-green-500 text-white scale-110' : ''}
                    ${isPending ? 'bg-gray-800 border-gray-600 text-gray-400' : ''}
                  `}
                >
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                
                {/* Rótulo da etapa */}
                <span 
                  className={`
                    mt-2 text-xs font-medium 
                    ${isCompleted || isCurrent ? 'text-green-400' : 'text-gray-500'}
                  `}
                >
                  {index === 0 && 'Pessoal'}
                  {index === 1 && 'Endereço'}
                  {index === 2 && 'Financeiro'}
                </span>
              </div>
            );
          })}
        </div>
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
            <input
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

          <div className="md:col-span-2">
            <label className="block text-green-400 mb-2" htmlFor="complemento">Complemento</label>
            <textarea
              id="complemento"
              name="complemento"
              value={formData.complemento}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500 min-h-[100px] resize-y"
              placeholder="Apartamento, bloco, ponto de referência, etc..."
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
        
        {/* Informações Básicas */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <span className="inline-flex items-center px-4 py-2 bg-green-600 bg-opacity-25 rounded-lg border border-green-500 text-green-400 font-medium text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informações Gerais
            </span>
            <div className="ml-3 flex-grow h-px bg-gray-700"></div>
          </div>
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
                <option value="Milena">Milena</option>
                <option value="Alana">Alana</option>
                <option value="Conaes">Conaes</option>
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
                <option value="Pós - Ccann">Pós - Ccann</option>
                <option value="Ccann">Ccann</option>
                <option value="Ped na Prática">Ped na Prática</option>
                <option value="Congresso">Congresso</option>
              </select>
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
          </div>
        </div>

        {/* Forma de Pagamento */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <span className="inline-flex items-center px-4 py-2 bg-green-600 bg-opacity-25 rounded-lg border border-green-500 text-green-400 font-medium text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              Forma de Pagamento
            </span>
            <div className="ml-3 flex-grow h-px bg-gray-700"></div>
          </div>
          
          <div className="mb-6">
            <label className="block text-green-400 mb-2" htmlFor="forma_cobranca">Tipo de Pagamento</label>
            <select
              id="forma_cobranca"
              name="forma_cobranca"
              value={formData.forma_cobranca}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
              required
            >
              <option value="À Vista">À Vista</option>
              <option value="Recorrência">Recorrência</option>
              <option value="C. Crédito">C. Crédito</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-green-400 mb-2" htmlFor="gateway">Gateway de Pagamento</label>
            <select
              id="gateway"
              name="gateway"
              value={formData.gateway}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
              required
            >
              <option value="PIX">PIX</option>
              <option value="ASAAS">ASAAS</option>
              <option value="GURU">GURU</option>
            </select>
          </div>

          {/* Switch para controlar se tem entrada */}
          <div className="mb-6">
            <div className="flex items-center">
              <label className="block text-green-400 mr-3" htmlFor="tem_entrada">Pagamento com Entrada</label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="tem_entrada"
                  name="tem_entrada"
                  checked={formData.tem_entrada}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      tem_entrada: e.target.checked
                    }));
                  }}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label
                  htmlFor="tem_entrada"
                  className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer"
                ></label>
              </div>
              <span className={`ml-2 text-sm ${formData.tem_entrada ? 'text-green-400' : 'text-gray-500'}`}>
                {formData.tem_entrada ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>

          {/* Opções condicionais com base na forma de cobrança selecionada */}
          {formData.forma_cobranca === 'À Vista' && (
            <div className="grid grid-cols-1 gap-6 bg-gray-750 p-4 rounded-lg border border-gray-700">
              <div>
                <label className="block text-green-400 mb-2" htmlFor="forma_pagamento">Meio de Pagamento</label>
                <select
                  id="forma_pagamento"
                  name="forma_pagamento"
                  value={formData.forma_pagamento}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="PIX">PIX</option>
                  <option value="BOLETO">BOLETO</option>
                </select>
              </div>

              {formData.forma_pagamento === 'Boleto' && (
                <div>
                  <label className="block text-green-400 mb-2" htmlFor="dia_vencimento">Dia de Vencimento</label>
                  <select
                    id="dia_vencimento"
                    name="dia_vencimento"
                    value={formData.dia_vencimento}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                    required
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                      <option key={dia} value={dia}>
                        {dia}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Campos para Entrada (se tem_entrada for true) */}
          {formData.tem_entrada && (
            <div className="grid grid-cols-1 gap-6 bg-gray-750 p-4 rounded-lg border border-gray-700 mt-4 mb-4">
              <h3 className="text-lg font-semibold text-green-400">Informações da Entrada</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-green-400 mb-2" htmlFor="valor_entrada">Valor de Entrada</label>
                  <input
                    type="text"
                    id="valor_entrada"
                    name="valor_entrada"
                    value={formData.valor_entrada ? formatCurrency(formData.valor_entrada) : ''}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                    placeholder="R$ 0,00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-green-400 mb-2" htmlFor="forma_pagamento_entrada">Meio de Pagamento da Entrada</label>
                  <select
                    id="forma_pagamento_entrada"
                    name="forma_pagamento_entrada"
                    value={formData.forma_pagamento_entrada}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                    required
                  >
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">BOLETO</option>
                    <option value="C. Crédito">C. Crédito</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {(formData.forma_cobranca === 'Recorrência' || formData.forma_cobranca === 'C. Crédito') && (
            <div className="grid grid-cols-1 gap-6 bg-gray-750 p-4 rounded-lg border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {formData.forma_cobranca === 'Recorrência' && (
                  <div>
                    <label className="block text-green-400 mb-2" htmlFor="forma_pagamento">Meio de Pagamento</label>
                    <select
                      id="forma_pagamento"
                      name="forma_pagamento"
                      value={formData.forma_pagamento}
                      onChange={handleChange}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                      required
                    >
                      <option value="PIX">PIX</option>
                      <option value="BOLETO">BOLETO</option>
                    </select>
                  </div>
                )}

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
                
                {formData.forma_pagamento === 'Boleto' && (
                  <div>
                    <label className="block text-green-400 mb-2" htmlFor="dia_vencimento">Dia de Vencimento</label>
                    <select
                      id="dia_vencimento"
                      name="dia_vencimento"
                      value={formData.dia_vencimento}
                      onChange={handleChange}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                      required
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                        <option key={dia} value={dia}>
                          {dia}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  // Renderiza os botões de navegação de acordo com a etapa atual
  const renderBotoesNavegacao = () => {
    return (
      <div className="mt-8 flex justify-between items-center">
        {etapaAtual > 1 && (
          <button
            type="button"
            onClick={() => setEtapaAtual(etapaAtual - 1)}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Voltar
          </button>
        )}
        
        <div className="flex-grow"></div>
        
        {etapaAtual < 3 && (
          <button
            type="button"
            onClick={() => setEtapaAtual(etapaAtual + 1)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Próximo
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
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      valor_pagar: '',
      tem_entrada: false,
      valor_entrada: '0',
      forma_pagamento_entrada: 'PIX',
      data: dataAtual,
      qtd_parcelas: 1,
      valor_parcela: '',
      forma_pagamento: 'PIX',
      produto: 'Ccann',
      vendedor: 'Milena',
      forma_cobranca: 'Parcelamento',
      dia_vencimento: '20',
      gateway: 'PIX'
    });
    setCep('');
    setEtapaAtual(1);
  };

  const renderBotaoConcluir = () => {
    if (etapaAtual === 3) {
      return (
        <button
          type="submit"
          onClick={handleSubmit}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Concluir e Gerar Contrato
        </button>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <style jsx global>{`
        .toggle-checkbox:checked {
          right: 0;
          border-color: #10B981;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #10B981;
        }
        .toggle-checkbox {
          right: 0;
          transition: all 0.3s;
          border-color: #666;
          left: 0;
        }
        .toggle-label {
          transition: all 0.3s;
        }
      `}</style>
      <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-green-400 mb-8 text-center">Criação de Contratos</h1>
        
        {renderIndicadorProgresso()}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderEtapaAtual()}
          {renderBotoesNavegacao()}
          {renderBotaoConcluir()}
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