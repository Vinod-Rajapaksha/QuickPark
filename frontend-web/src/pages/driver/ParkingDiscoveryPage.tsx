import React from "react";
import { Link } from "react-router-dom";
import { Map, MapPin, Navigation, Search } from "lucide-react";
import Card from "../../components/common/Card/Card";
import { ROUTES } from "../../app/routes/routeConstants";

const DISCOVERY_OPTIONS = [
  {
    to: ROUTES.PARKING_DISCOVERY_NAME,
    icon: Search,
    title: "Search by Name",
    description:
      "Know the property's name? Look it up directly and narrow the list with price and EV filters.",
  },
  {
    to: ROUTES.PARKING_DISCOVERY_DESTINATION,
    icon: MapPin,
    title: "Search by Destination",
    description:
      "Heading somewhere? Find parking in the city or town you are travelling to, filtered by province and district.",
  },
  {
    to: ROUTES.PARKING_DISCOVERY_NEARBY,
    icon: Navigation,
    title: "Nearby Search",
    description:
      "Out and about? Use your current location to see approved parking around you on a live map.",
  },
];

export const ParkingDiscoveryPage: React.FC = () => (
  <div className="mx-auto max-w-5xl space-y-6">
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        <Map size={24} className="text-slate-400" />
        Parking Discovery
      </h1>
      <p className="mt-1 text-slate-500">
        Find approved QuickPark parking three ways — pick whichever suits where you are right now.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {DISCOVERY_OPTIONS.map((option) => (
        <Link key={option.to} to={option.to} className="block">
          <Card interactive padding="md" className="h-full">
            <span className="inline-flex rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <option.icon size={22} />
            </span>
            <h2 className="mt-3 font-semibold text-slate-900">{option.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{option.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  </div>
);

export default ParkingDiscoveryPage;
