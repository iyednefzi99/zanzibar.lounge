import type { Dictionary } from "./fr";

const pt: Dictionary = {
  meta: {
    title: "Zanzibar Lounge — Medjez el Bab",
    description:
      "Café, cozinha e narguilé em Medjez el Bab. Terraço aberto da manhã até tarde. Reserve uma mesa por WhatsApp, SMS ou online.",
  },

  nav: {
    menu: "Cardápio",
    gallery: "Galeria",
    info: "Como chegar",
    book: "Reservar",
    language: "Idioma",
    skipToContent: "Ir para o conteúdo",
  },

  status: {
    openUntil: "Aberto até {time}",
    opensAt: "Abre às {time}",
    opensDay: "Abre {day} às {time}",
    closedToday: "Fechado hoje",
    now: "agora",
  },

  hero: {
    eyebrow: "Medjez el Bab · Béja",
    title: "Zanzibar é o seu lugar feliz",
    lead: "Um terraço, um cardápio curto, café que presta, e narguilé até tarde. Guardamos uma mesa para você.",
    book: "Reservar uma mesa",
    bookWhatsapp: "Reservar no WhatsApp",
    menu: "Ver o cardápio",
  },

  about: {
    title: "O que fazemos",
    body: "Abrimos de manhã para o café e fechamos quando a última mesa vai embora. No meio: uma cozinha simples que assumimos, sucos frescos na hora, e um terraço na Avenue de l'Environnement onde você pode ficar três horas sem que ninguém lhe apresse.",
    covers: "{count} lugares",
    zones: {
      title: "Três formas de se sentar",
      terrasse: {
        name: "O terraço",
        body: "Na avenida, à sombra. O narguilé é servido aqui o dia todo.",
      },
      salle: {
        name: "O salão",
        body: "Tranquilo e protegido. É onde vão os grandes grupos.",
      },
      salon: {
        name: "A lounge",
        body: "Assentos baixos, luz suave. Para ficar um bom tempo.",
      },
    },
  },

  menu: {
    title: "Cardápio",
    lead: "Preços em dinares tunisinos, serviço incluso.",
    priceOfDay: "Preço do dia",
    jumpTo: "Ir para",
    tags: {
      vegetarien: "Vegetariano",
      epice: "Ardido",
      signature: "Da casa",
      "sans-alcool": "Sem álcool",
    },
  },

  gallery: {
    title: "Em imagens",
    lead: "As fotos vêm do Instagram do estabelecimento.",
    instagram: "Seguir no Instagram",
  },

  info: {
    title: "Como chegar",
    address: "Endereço",
    hours: "Horário",
    contact: "Contato",
    directions: "Abrir no Maps",
    phone: "Telefone",
    whatsapp: "WhatsApp",
    closed: "Fechado",
    today: "Hoje",
    reviews: "Ler avaliações no TripAdvisor",
  },

  booking: {
    title: "Reservar uma mesa",
    lead: "Três linhas e está reservado. Você recebe a confirmação por WhatsApp ou SMS — e um lembrete na véspera.",
    orChat:
      "Prefere escrever? Nosso agente responde no WhatsApp e por SMS, 24 horas.",
    fields: {
      name: "Nome",
      phone: "Telefone",
      phoneHint: "Formato internacional, por exemplo +216 20 123 456",
      date: "Data",
      time: "Horário",
      partySize: "Número de pessoas",
      zone: "Onde você quer se sentar?",
      zoneAny: "Tanto faz",
      notes: "Alguma observação? (aniversário, carrinho, alergia…)",
      notesPlaceholder: "Opcional",
    },
    zones: {
      terrasse: "Terraço",
      salle: "Salão",
      salon: "Lounge",
    },
    periods: {
      morning: "De manhã",
      afternoon: "À tarde",
      evening: "À noite",
      late: "Late night",
    },
    otp: {
      label: "Código de verificação",
      hint: "Enviaremos um código de seis dígitos para confirmar seu número.",
      send: "Enviar o código",
      sending: "Enviando…",
      sent: "Código enviado. Válido por dez minutos.",
      resend: "Reenviar",
      missing: "Digite o código que você recebeu.",
      invalid: "Código incorreto.",
      expired: "Código expirado. Solicite um novo.",
      tooMany: "Muitas tentativas. Solicite um novo código.",
      failed: "Não foi possível enviar o código. Tente novamente em instantes.",
    },
    slotsLoading: "Buscando horários…",
    submit: "Reservar",
    submitting: "Enviando…",
    success: {
      title: "Reservado",
      body: "Sua mesa no {date} às {time} para {count} pessoas está reservada. Enviaremos a confirmação para {phone}.",
      again: "Fazer outra reserva",
    },
    errors: {
      generic: "A reserva não foi concluída. Tente novamente ou ligue para nós.",
      name: "Informe o nome que aparecerá na reserva.",
      phone: "Número inválido. Use o formato internacional, ex. +21620123456.",
      date: "Escolha uma data.",
      time: "Escolha um horário.",
      partySize: "Informe o número de pessoas.",
      closed: "O estabelecimento está fechado nesse horário.",
      slotsUnavailable:
        "Os horários não estão sendo exibidos agora. Tente novamente ou nos escreva no WhatsApp.",
      tooSoon: "É preciso reservar com pelo menos {minutes} minutos de antecedência.",
      tooFar: "As reservas abrem {days} dias antes.",
      partyTooLarge:
        "Para mais de {max} pessoas, ligue para nós — organizamos com você.",
      full: "Esse horário está cheio. Tente {alternatives}.",
      rateLimited: "Muitas tentativas. Aguarde um minuto.",
    },
  },

  notFound: {
    title: "Página não encontrada",
    description: "A página que você procura não existe ou foi movida.",
    backHome: "Voltar ao início",
  },

  discover: {
    title: "Conheça nossos restaurantes",
    description: "Encontre o restaurante perfeito perto de você.",
    search: "Buscar restaurante ou cozinha...",
    filters: { cuisine: "Tipo de cozinha", price: "Orçamento", rating: "Avaliação mínima", openNow: "Aberto agora", sort: "Ordenar por" },
    sort: { relevance: "Relevância", rating: "Mais avaliados", price: "Preço", distance: "Distância", popularity: "Popularidade", name: "Nome A-Z", newest: "Mais recente" },
    cards: { reviews: "avaliações", book: "Reservar", open: "Aberto", closed: "Fechado", featured: "Popular" },
    empty: "Nenhum restaurante corresponde aos seus critérios.",
    loading: "Buscando...",
    pagination: { previous: "Anterior", next: "Próximo" },
  },

  footer: {
    tagline: "Zanzibar é o seu lugar feliz",
    follow: "Seguir",
    rights: "Todos os direitos reservados.",
  },

  reviews: {
    title: "O que dizem nossos hóspedes",
    lead: "Leia o que nossos hóspedes pensam sobre sua experiência no Zanzibar Lounge.",
    formTitle: "Deixe uma avaliação",
    titleField: "Título",
    rating: "Nota",
    comment: "Comentário",
    submit: "Enviar",
    success: "Obrigado! Sua avaliação será exibida após moderação.",
    error: "Ocorreu um erro. Tente novamente.",
    namePlaceholder: "Seu nome",
  },

  days: {
    long: [
      "domingo",
      "segunda-feira",
      "terça-feira",
      "quarta-feira",
      "quinta-feira",
      "sexta-feira",
      "sábado",
    ],
    short: ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],
  },
};

export default pt;
