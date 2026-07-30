import type { DashboardData } from "../types";

export const demoDashboard: DashboardData = {
  demo: true,
  user: {
    firstName: "Nicolas",
    fullName: "Nicolas D.",
    initials: "ND",
    assignedSpot: "A-24",
    assignedLevel: "Niveau A",
  },
  organization: {
    name: "Victor Buck Services",
    sharedTotal: 1300,
  },
  stats: {
    shares: 12,
    reservations: 9,
    availableSpots: 27,
  },
  availability: [
    {
      id: "availability-a24-thu",
      dateLabel: "Jeu. 30 juillet",
      timeLabel: "08:00 – 18:00",
      spot: "A-24",
      level: "Niveau A",
      status: "AVAILABLE",
    },
    {
      id: "availability-b18-fri",
      dateLabel: "Ven. 31 juillet",
      timeLabel: "09:00 – 17:00",
      spot: "B-18",
      level: "Niveau B",
      status: "AVAILABLE",
    },
    {
      id: "availability-c07-mon",
      dateLabel: "Lun. 3 août",
      timeLabel: "12:00 – 16:00",
      spot: "C-07",
      level: "Niveau C",
      status: "AVAILABLE",
    },
    {
      id: "availability-d12-tue",
      dateLabel: "Mar. 4 août",
      timeLabel: "08:30 – 18:00",
      spot: "D-12",
      level: "Niveau D",
      status: "AVAILABLE",
    },
    {
      id: "availability-e03-wed",
      dateLabel: "Mer. 5 août",
      timeLabel: "10:00 – 14:00",
      spot: "E-03",
      level: "Niveau E",
      status: "AVAILABLE",
    },
  ],
  thanks: [
    {
      id: "thanks-julie",
      initials: "JL",
      author: "Julie L.",
      message: "Merci Nicolas, ta place m’a bien dépannée !",
      when: "Aujourd’hui",
    },
    {
      id: "thanks-alexis",
      initials: "AM",
      author: "Alexis M.",
      message: "Super partage ce matin, merci encore.",
      when: "Hier",
    },
    {
      id: "thanks-sophie",
      initials: "SR",
      author: "Sophie R.",
      message: "Au top, comme d’habitude. Merci !",
      when: "Il y a 2 j",
    },
  ],
};
