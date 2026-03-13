/**
 * VMMC Neo-Skeuomorphism — Card Component System
 *
 * Usage:
 *
 *   import { Card } from '@/components/ui/Card';
 *
 *   <Card.Flat padding="md" onClick={handleClick}>
 *     <Card.Header icon={<Icon />} badge="New">
 *       <h3 className="font-bold text-gray-900">Title</h3>
 *     </Card.Header>
 *     <Card.Body>Content here</Card.Body>
 *     <Card.Footer actions={[<Button key="save">Save</Button>]} />
 *   </Card.Flat>
 *
 *   <Card.Glass padding="md">...</Card.Glass>
 *   <Card.Tilt padding="md">...</Card.Tilt>
 *   <Card.Magnetic onClick={fn}>...</Card.Magnetic>
 *   <Card.Expandable summary={<span>Summary</span>}>Detail</Card.Expandable>
 *   <Card.Stat label="Total" value={128} trend="up" trendLabel="+12%" />
 */

import { CardFlat, CardGlass, CardTilt, CardMagnetic, CardExpandable, CardStat } from './CardVariants';
import { CardHeader, CardBody, CardFooter } from './CardParts';

export const Card = {
  Flat:       CardFlat,
  Glass:      CardGlass,
  Tilt:       CardTilt,
  Magnetic:   CardMagnetic,
  Expandable: CardExpandable,
  Stat:       CardStat,
  Header:     CardHeader,
  Body:       CardBody,
  Footer:     CardFooter,
};

// Named exports for tree-shaking
export { CardFlat, CardGlass, CardTilt, CardMagnetic, CardExpandable, CardStat };
export { CardHeader, CardBody, CardFooter };
